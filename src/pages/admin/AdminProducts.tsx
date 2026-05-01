import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { VEHICLE_LABELS, VehicleType, formatPHP } from "@/lib/constants";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { resolveImage } from "@/lib/images";

const empty = {
  name: "", vehicle_type: "minivan" as VehicleType, size: "", finish: "Chrome",
  color: "Silver", color_hex: "#C0C7CF", design_pattern: "Multi-Spoke",
  price: "", description: "", in_stock: true, is_available: true,
  before_photo_url: "", after_photo_url: "",
};

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("rim_products").select("*").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setEditOpen(true); };
  const openEdit = (p: any) => { setForm({ ...p, price: String(p.price), before_photo_url: p.before_photo_url ?? "", after_photo_url: p.after_photo_url ?? "" }); setEditingId(p.id); setEditOpen(true); };

  const uploadPhoto = async (file: File, kind: "before" | "after") => {
    const setter = kind === "before" ? setUploadingBefore : setUploadingAfter;
    setter(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `public/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("rim-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("rim-photos").getPublicUrl(path);
      setForm((f: any) => ({ ...f, [`${kind}_photo_url`]: data.publicUrl }));
    } catch (e: any) { toast.error(e.message); } finally { setter(false); }
  };

  const save = async () => {
    if (!form.name || !form.size || !form.price) { toast.error("Pakipuno ang required fields"); return; }
    const payload = {
      name: form.name, vehicle_type: form.vehicle_type, size: form.size, finish: form.finish,
      color: form.color, color_hex: form.color_hex, design_pattern: form.design_pattern,
      price: Number(form.price), description: form.description || null,
      in_stock: form.in_stock, is_available: form.is_available,
      before_photo_url: form.before_photo_url || null, after_photo_url: form.after_photo_url || null,
    };
    const { error } = editingId
      ? await supabase.from("rim_products").update(payload).eq("id", editingId)
      : await supabase.from("rim_products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("rim_products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const toggleAvail = async (id: string, val: boolean) => {
    await supabase.from("rim_products").update({ is_available: val }).eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your rim catalog.</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />New Product</Button>
      </div>

      {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mt-20" /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="bg-gradient-card border-border/60 overflow-hidden">
              <div className="grid grid-cols-2">
                <img src={resolveImage(p.before_photo_url)} alt="before" className="aspect-square object-cover bg-secondary" />
                <img src={resolveImage(p.after_photo_url)} alt="after" className="aspect-square object-cover bg-secondary border-l border-border" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{VEHICLE_LABELS[p.vehicle_type as VehicleType]} · {p.size} · {p.finish} · {p.color}</div>
                  </div>
                  <Badge variant={p.in_stock ? "default" : "secondary"}>{p.in_stock ? "In Stock" : "Out"}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-bold text-gradient-chrome">{formatPHP(Number(p.price))}</div>
                  <div className="flex items-center gap-2">
                    <Switch checked={p.is_available} onCheckedChange={(v) => toggleAvail(p.id, v)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Vehicle Type</Label>
              <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => <SelectItem key={v} value={v}>{VEHICLE_LABELS[v]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Size</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder='e.g. 16"' /></div>
            <div><Label>Finish</Label><Input value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })} /></div>
            <div><Label>Design / Pattern</Label><Input value={form.design_pattern} onChange={(e) => setForm({ ...form, design_pattern: e.target.value })} /></div>
            <div><Label>Color name</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            <div><Label>Color hex</Label><Input type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} /></div>
            <div className="col-span-2"><Label>Price (₱)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-1">
              <Label>Before photo</Label>
              {form.before_photo_url && <img src={resolveImage(form.before_photo_url)} className="w-full aspect-square object-cover rounded-md mt-1 mb-1" alt="before" />}
              <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed cursor-pointer text-sm">
                {uploadingBefore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "before")} />
              </label>
            </div>
            <div className="col-span-1">
              <Label>After photo</Label>
              {form.after_photo_url && <img src={resolveImage(form.after_photo_url)} className="w-full aspect-square object-cover rounded-md mt-1 mb-1" alt="after" />}
              <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed cursor-pointer text-sm">
                {uploadingAfter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "after")} />
              </label>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} /><Label>In Stock</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} /><Label>Available</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-gradient-primary">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
