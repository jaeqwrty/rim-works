import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { VEHICLE_LABELS, formatPHP } from "@/lib/constants";

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      setOrder(data);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 max-w-2xl">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !order ? (
          <Card className="p-8 text-center">Hindi nahanap ang order.</Card>
        ) : (
          <Card className="p-8 bg-gradient-card border-border/60 metallic-border">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              </div>
              <h1 className="font-display text-3xl font-bold">Salamat sa order mo!</h1>
              <p className="text-muted-foreground mt-2">Ipinapadala namin ang updates sa email mo.</p>
            </div>

            <div className="rounded-lg border border-border p-5 bg-secondary/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference Number</span>
                <span className="font-mono font-bold text-primary">{order.reference_number}</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sasakyan</span><span>{VEHICLE_LABELS[order.vehicle_type as keyof typeof VEHICLE_LABELS]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rim</span><span>{order.product_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Config</span><span className="text-right">{order.config_size} · {order.config_finish}<br />{order.config_color} · {order.config_design}</span></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span>Total</span><span className="font-bold text-gradient-chrome text-lg">{formatPHP(Number(order.total_price))}</span></div>
            </div>

            {order.downpayment_status === "none" ? (
              <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <strong className="text-amber-400">Reminder:</strong> Walang downpayment ang order na ito. Kailangan i-settle ang full payment pagdating mo sa shop.
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
                Na-upload na ang iyong proof of payment! Ire-review ito ng team namin.
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button asChild className="flex-1 bg-gradient-primary"><Link to="/orders">Tingnan ang Orders</Link></Button>
              <Button asChild variant="outline" className="flex-1"><Link to="/">Bumalik sa Home</Link></Button>
            </div>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default OrderConfirmation;
