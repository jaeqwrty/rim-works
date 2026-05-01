import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingBag, LogOut, Wrench, Loader2 } from "lucide-react";

const AdminLayout = () => {
  const { user, role, loading, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) nav("/admin/login", { replace: true });
  }, [user, role, loading, nav]);

  if (loading || !user || role !== "admin") {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-smooth ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-gradient-primary grid place-items-center"><Wrench className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="font-display font-bold leading-tight">RimWorks</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin" end className={linkClass}><LayoutDashboard className="h-4 w-4" />Overview</NavLink>
          <NavLink to="/admin/products" className={linkClass}><Package className="h-4 w-4" />Products</NavLink>
          <NavLink to="/admin/orders" className={linkClass}><ShoppingBag className="h-4 w-4" />Orders</NavLink>
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground px-2 mb-2 truncate">{user.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut().then(() => nav("/admin/login"))}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-8"><Outlet /></div></main>
    </div>
  );
};

export default AdminLayout;
