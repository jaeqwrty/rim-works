import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VEHICLE_LABELS, ORDER_STATUS_LABEL, formatPHP, ORDER_STATUS_FLOW } from "@/lib/constants";
import { Loader2, Package } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  ready_for_pickup: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { nav("/auth?next=/orders"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, nav]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-10">
        <h1 className="font-display text-3xl font-bold mb-2">Mga Order Ko</h1>
        <p className="text-muted-foreground mb-8">I-track ang status ng bawat order mo.</p>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center bg-gradient-card">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Wala ka pang order. Tara, mag-customize na!</p>
            <Button onClick={() => nav("/")} className="bg-gradient-primary">Pumili ng sasakyan</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const stepIdx = ORDER_STATUS_FLOW.indexOf(o.status);
              return (
                <Card key={o.id} className="p-5 bg-gradient-card border-border/60">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Ref #{o.reference_number}</div>
                      <div className="font-display font-bold text-lg">{o.product_name}</div>
                      <div className="text-sm text-muted-foreground">{VEHICLE_LABELS[o.vehicle_type as keyof typeof VEHICLE_LABELS]} · {o.config_size} · {o.config_finish} · {o.config_color} · {o.config_design}</div>
                      <div className="text-xs text-muted-foreground mt-1">{format(new Date(o.created_at), "PPp")}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={STATUS_COLORS[o.status] ?? ""}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      <div className="font-display font-bold text-xl mt-1 text-gradient-chrome">{formatPHP(Number(o.total_price))}</div>
                    </div>
                  </div>
                  {o.status !== "cancelled" && stepIdx >= 0 && (
                    <div className="flex gap-1.5">
                      {ORDER_STATUS_FLOW.map((s, i) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? "bg-gradient-primary" : "bg-secondary"}`} />
                      ))}
                    </div>
                  )}
                  {o.downpayment_status !== "none" && (
                    <div className="text-xs text-muted-foreground mt-3">
                      Downpayment ({formatPHP(Number(o.downpayment_amount ?? 0))}):{" "}
                      <span className={o.downpayment_status === "verified" ? "text-emerald-400" : o.downpayment_status === "needs_followup" ? "text-amber-400" : "text-blue-400"}>
                        {o.downpayment_status.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default OrderHistory;
