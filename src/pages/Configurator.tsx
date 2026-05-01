import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { VehicleType, VEHICLE_LABELS, VEHICLE_TAGLINES, formatPHP } from "@/lib/constants";
import { resolveImage, stockRim } from "@/lib/images";
import { Loader2, ArrowLeft, ShoppingBag, Upload, Sparkles } from "lucide-react";

interface Product {
  id: string;
  vehicle_type: VehicleType;
  name: string;
  size: string;
  finish: string;
  color: string;
  color_hex: string;
  design_pattern: string;
  price: number;
  in_stock: boolean;
  is_available: boolean;
  before_photo_url: string | null;
  after_photo_url: string | null;
  description: string | null;
}

const Configurator = () => {
  const { vehicleType } = useParams<{ vehicleType: VehicleType }>();
  const nav = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState<string>("");
  const [finish, setFinish] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [design, setDesign] = useState<string>("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [withDownpayment, setWithDownpayment] = useState(false);
  const [dpAmount, setDpAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!vehicleType || !VEHICLE_LABELS[vehicleType as VehicleType]) {
      nav("/");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("rim_products")
        .select("*")
        .eq("vehicle_type", vehicleType)
        .eq("is_available", true);
      if (error) toast.error(error.message);
      setProducts((data ?? []) as Product[]);
      setLoading(false);
    })();
  }, [vehicleType, nav]);

  const sizes = useMemo(() => Array.from(new Set(products.map((p) => p.size))).sort(), [products]);
  const finishes = useMemo(() => Array.from(new Set(products.filter((p) => !size || p.size === size).map((p) => p.finish))), [products, size]);
  const colors = useMemo(() => {
    const filtered = products.filter((p) => (!size || p.size === size) && (!finish || p.finish === finish));
    const map = new Map<string, string>();
    filtered.forEach((p) => map.set(p.color, p.color_hex));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products, size, finish]);
  const designs = useMemo(() => {
    const filtered = products.filter((p) => (!size || p.size === size) && (!finish || p.finish === finish) && (!color || p.color === color));
    return Array.from(new Set(filtered.map((p) => p.design_pattern)));
  }, [products, size, finish, color]);

  const matched = useMemo(() => {
    return products.find(
      (p) => (!size || p.size === size) && (!finish || p.finish === finish) && (!color || p.color === color) && (!design || p.design_pattern === design)
    );
  }, [products, size, finish, color, design]);

  const allSelected = size && finish && color && design && matched;

  const submitOrder = async () => {
    if (!user) {
      toast.error("Mag-login muna para mag-order");
      nav(`/auth?next=/configure/${vehicleType}`);
      return;
    }
    if (!matched) return;
    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (withDownpayment && proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
        if (upErr) throw upErr;
        proofUrl = path;
      }

      const dpVal = withDownpayment ? Number(dpAmount) : null;
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: matched.id,
          vehicle_type: matched.vehicle_type,
          config_size: matched.size,
          config_finish: matched.finish,
          config_color: matched.color,
          config_design: matched.design_pattern,
          product_name: matched.name,
          total_price: matched.price,
          downpayment_amount: dpVal,
          downpayment_status: withDownpayment && proofFile ? "pending_verification" : "none",
          proof_of_payment_url: proofUrl,
          customer_notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Na-submit na ang order mo!");
      nav(`/orders/${data.id}/confirmation`);
    } catch (e: any) {
      toast.error(e.message ?? "May problema sa pag-submit");
    } finally {
      setSubmitting(false);
    }
  };

  const vt = vehicleType as VehicleType;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8">
        <Button variant="ghost" size="sm" onClick={() => nav("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Ibang sasakyan
        </Button>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-primary mb-1">{VEHICLE_TAGLINES[vt]}</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">I-customize ang rim para sa {VEHICLE_LABELS[vt]}</h1>
          <p className="text-muted-foreground mt-2">Pumili ng size, finish, kulay, at design. Live preview habang pinipili mo.</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <Card className="p-10 text-center bg-gradient-card">Walang available na rims para sa {VEHICLE_LABELS[vt]} sa ngayon.</Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* PREVIEW */}
            <div className="space-y-6">
              <Card className="bg-gradient-card border-border/60 overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-background/80 backdrop-blur text-[10px] uppercase tracking-wider font-semibold">Stock</div>
                    <img src={stockRim} alt="Stock factory rim" loading="lazy" width={800} height={800} className="w-full aspect-square object-cover bg-secondary" />
                  </div>
                  <div className="relative border-l border-border/60">
                    <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Customized
                    </div>
                    <img
                      src={resolveImage(matched?.after_photo_url) }
                      alt={matched ? `Customized ${matched.name}` : "Custom preview"}
                      loading="lazy" width={800} height={800}
                      className="w-full aspect-square object-cover bg-secondary"
                    />
                  </div>
                </div>
                {matched && (
                  <div className="p-5 border-t border-border/60">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Match</div>
                    <div className="font-display font-bold text-xl">{matched.name}</div>
                    {matched.description && <p className="text-sm text-muted-foreground mt-1">{matched.description}</p>}
                  </div>
                )}
              </Card>

              {/* PRICE + CTA */}
              <Card className="bg-gradient-card border-border/60 p-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Kabuuan</div>
                  <div className="font-display text-3xl font-bold text-gradient-chrome">
                    {matched ? formatPHP(matched.price) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Kasama ang installation</div>
                </div>
                <Button size="lg" disabled={!allSelected} onClick={() => setReviewOpen(true)} className="bg-gradient-primary shadow-glow">
                  <ShoppingBag className="h-4 w-4 mr-2" /> I-review ang order
                </Button>
              </Card>
            </div>

            {/* OPTIONS */}
            <div className="space-y-4">
              <Card className="p-5 bg-gradient-card border-border/60">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Size</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => { setSize(s); setFinish(""); setColor(""); setDesign(""); }}
                      className={`py-3 rounded-lg border text-sm font-semibold transition-smooth ${size === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-gradient-card border-border/60">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Finish</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {finishes.map((f) => (
                    <button key={f} onClick={() => { setFinish(f); setColor(""); setDesign(""); }}
                      disabled={!size}
                      className={`py-3 rounded-lg border text-sm font-semibold transition-smooth disabled:opacity-40 ${finish === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-gradient-card border-border/60">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((c) => (
                    <button key={c.name} onClick={() => { setColor(c.name); setDesign(""); }}
                      disabled={!finish}
                      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm transition-smooth disabled:opacity-40 ${color === c.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                      <span className="h-6 w-6 rounded-full border border-border" style={{ background: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-gradient-card border-border/60">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Design / Pattern</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {designs.map((d) => (
                    <button key={d} onClick={() => setDesign(d)}
                      disabled={!color}
                      className={`py-3 px-4 rounded-lg border text-sm font-semibold text-left transition-smooth disabled:opacity-40 ${design === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* REVIEW DIALOG */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>I-review ang iyong order</DialogTitle>
          </DialogHeader>
          {matched && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-secondary/30 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sasakyan</span><span className="font-semibold">{VEHICLE_LABELS[vt]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rim</span><span className="font-semibold">{matched.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{matched.size}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Finish</span><span>{matched.finish}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Color</span><span>{matched.color}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Design</span><span>{matched.design_pattern}</span></div>
                <div className="flex justify-between border-t border-border pt-2 mt-2 text-base"><span>Total</span><span className="font-bold text-gradient-chrome">{formatPHP(matched.price)}</span></div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-sm">Mag-downpayment ngayon?</div>
                    <div className="text-xs text-muted-foreground">Optional. Pwede mong bayaran lahat sa shop.</div>
                  </div>
                  <Switch checked={withDownpayment} onCheckedChange={setWithDownpayment} />
                </div>
                {withDownpayment && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div>
                      <Label>Halaga ng downpayment (₱)</Label>
                      <Input type="number" value={dpAmount} onChange={(e) => setDpAmount(e.target.value)} placeholder="e.g. 2000" />
                    </div>
                    <div>
                      <Label>Proof of payment (GCash screenshot, atbp.)</Label>
                      <label className="mt-1 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary text-sm">
                        <Upload className="h-4 w-4" />
                        {proofFile ? proofFile.name : "I-upload ang screenshot"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="May request ka ba? Ilagay mo dito." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Bumalik</Button>
            <Button onClick={submitOrder} disabled={submitting} className="bg-gradient-primary">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} I-confirm ang order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default Configurator;
