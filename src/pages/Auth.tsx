import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { Loader2, Wrench } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Pakilagay ang buong pangalan").max(100),
  email: z.string().trim().email("Hindi valid ang email").max(255),
  phone: z.string().trim().min(7, "Pakilagay ang phone number").max(20),
  password: z.string().min(6, "At least 6 characters ang password").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email("Hindi valid ang email"),
  password: z.string().min(1, "Required ang password"),
});

const Auth = () => {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ full_name: "", email: "", phone: "", password: "" });

  const next = params.get("next") ?? "/";

  useEffect(() => {
    if (!authLoading && user) nav(next, { replace: true });
  }, [user, authLoading, nav, next]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signin);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    nav(next, { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signup);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tagumpay! I-check ang email mo para mag-confirm.");
    setTab("signin");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signin.email) { toast.error("Pakilagay ang email mo"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(signin.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Naipadala na ang reset link sa email mo.");
    setResetMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center py-12 px-4">
        <Card className="w-full max-w-md p-8 bg-gradient-card border-border/60 metallic-border">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-center mb-1">Welcome sa RimWorks PH</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Mag-login o gumawa ng account para makapag-order.</p>

          {resetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={signin.email} onChange={(e) => setSignin({ ...signin, email: e.target.value })} placeholder="ikaw@email.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send reset link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>Bumalik</Button>
            </form>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signin">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={signin.email} onChange={(e) => setSignin({ ...signin, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={signin.password} onChange={(e) => setSignin({ ...signin, password: e.target.value })} required />
                  </div>
                  <button type="button" onClick={() => setResetMode(true)} className="text-xs text-primary hover:underline">Nakalimutan ang password?</button>
                  <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Mag-login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label>Buong Pangalan</Label>
                    <Input value={signup.full_name} onChange={(e) => setSignup({ ...signup, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} placeholder="09XX XXX XXXX" required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Gumawa ng Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Admin ka? <Link to="/admin/login" className="text-primary hover:underline">Pumunta sa admin login</Link>
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
