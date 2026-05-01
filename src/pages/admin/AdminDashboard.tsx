import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Clock, Wrench, CheckCircle2, DollarSign } from "lucide-react";
import { formatPHP } from "@/lib/constants";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, revenue: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("status, total_price");
      if (!data) return;
      const s = { total: data.length, pending: 0, in_progress: 0, completed: 0, revenue: 0 };
      data.forEach((o: any) => {
        if (o.status === "pending") s.pending++;
        if (o.status === "in_progress" || o.status === "confirmed" || o.status === "ready_for_pickup") s.in_progress++;
        if (o.status === "completed") { s.completed++; s.revenue += Number(o.total_price); }
      });
      setStats(s);
    })();
  }, []);

  const cards = [
    { label: "Total Orders", value: stats.total, icon: ShoppingBag, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
    { label: "In Progress", value: stats.in_progress, icon: Wrench, color: "text-blue-400" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Revenue", value: formatPHP(stats.revenue), icon: DollarSign, color: "text-gradient-chrome" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-1">Overview</h1>
      <p className="text-muted-foreground mb-8">Quick snapshot of your shop.</p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 bg-gradient-card border-border/60">
            <c.icon className={`h-5 w-5 mb-3 ${c.color}`} />
            <div className="text-2xl font-display font-bold">{c.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{c.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
