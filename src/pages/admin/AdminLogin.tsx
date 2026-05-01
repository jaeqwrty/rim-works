import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const AdminLogin = () => {
  const nav = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role === "admin") nav("/admin", { replace: true });
  }, [user, role, authLoading, nav]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); toast.error(error.message); return; }
    const uid = data.user?.id;
    if (uid) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error("This account does not have admin access.");
        return;
      }
    }
    setLoading(false);
    toast.success("Welcome, admin.");
    nav("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <Card className="w-full max-w-md p-8 bg-gradient-card border-border/60 metallic-border">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-secondary grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-center">Admin Access</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">RimWorks PH staff portal.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sign in
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">
          <Link to="/" className="hover:text-foreground">← Back to storefront</Link>
        </p>
      </Card>
    </div>
  );
};

export default AdminLogin;
