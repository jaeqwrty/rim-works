import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VEHICLE_LABELS, ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, formatPHP, VehicleType } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Eye, FileImage } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  ready_for_pickup: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dpFilter, setDpFilter] = useState("all");
  const [viewing, setViewing] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, profiles(full_name, email, phone)").order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) =>
    (vehicleFilter === "all" || o.vehicle_type === vehicleFilter) &&
    (statusFilter === "all" || o.status === statusFilter) &&
    (dpFilter === "all" || o.downpayment_status === dpFilter)
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    load();
  };

  const updateDP = async (id: string, downpayment_status: string) => {
    const { error } = await supabase.from("orders").update({ downpayment_status: downpayment_status as any }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    load();
  };

  const viewOrder = async (o: any) => {
    setViewing(o);
    if (o.proof_of_payment_url) {
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(o.proof_of_payment_url, 600);
      setProofUrl(data?.signedUrl ?? null);
    } else {
      setProofUrl(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-1">Orders</h1>
      <p className="text-muted-foreground mb-6">Manage the full order pipeline.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Vehicle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vehicles</SelectItem>
            {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => <SelectItem key={v} value={v}>{VEHICLE_LABELS[v]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dpFilter} onValueChange={setDpFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Downpayment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All downpayments</SelectItem>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="pending_verification">Pending verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="needs_followup">Needs follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mt-20" /> : (
        <Card className="bg-gradient-card border-border/60 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ref</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Downpayment</th>
                <th className="text-left p-3">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="p-3 font-mono text-xs text-primary">{o.reference_number}</td>
                  <td className="p-3">
                    <div className="font-semibold">{o.profiles?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{o.profiles?.phone}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{o.product_name}</div>
                    <div className="text-xs text-muted-foreground">{VEHICLE_LABELS[o.vehicle_type as VehicleType]} · {o.config_size}</div>
                  </td>
                  <td className="p-3 font-semibold">{formatPHP(Number(o.total_price))}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className={`h-8 w-40 ${STATUS_COLORS[o.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUS_FLOW.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>)}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {o.downpayment_status === "none" ? <Badge variant="secondary">None</Badge> : (
                      <Select value={o.downpayment_status} onValueChange={(v) => updateDP(o.id, v)}>
                        <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_verification">Pending verification</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="needs_followup">Needs follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{format(new Date(o.created_at), "PP")}</td>
                  <td className="p-3"><Button variant="ghost" size="icon" onClick={() => viewOrder(o)}><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center p-10 text-muted-foreground">No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-primary">{viewing.reference_number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{viewing.profiles?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewing.profiles?.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{viewing.profiles?.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span>{viewing.product_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Config</span><span className="text-right">{viewing.config_size} · {viewing.config_finish}<br />{viewing.config_color} · {viewing.config_design}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">{formatPHP(Number(viewing.total_price))}</span></div>
              {viewing.customer_notes && <div><div className="text-muted-foreground">Customer notes</div><div className="bg-secondary/40 p-2 rounded mt-1">{viewing.customer_notes}</div></div>}
              {proofUrl && (
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1"><FileImage className="h-4 w-4" />Proof of Payment</div>
                  <img src={proofUrl} alt="proof of payment" className="w-full rounded-md border border-border" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
