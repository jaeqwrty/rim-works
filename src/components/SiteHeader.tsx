import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, User, LogOut, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-md bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-105 transition-smooth">
            <Wrench className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-lg tracking-tight">RimWorks<span className="text-primary">.</span>PH</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Custom Wide Rims</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-smooth">Home</Link>
          <a href="/#vehicles" className="text-muted-foreground hover:text-foreground transition-smooth">Pumili ng Sasakyan</a>
          {user && <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-smooth">Mga Order Ko</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[140px] truncate">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => nav("/orders")}>
                  <Package className="h-4 w-4 mr-2" /> Mga Order Ko
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => nav("/"))}>
                  <LogOut className="h-4 w-4 mr-2" /> Mag-logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => nav("/auth")} variant="default" size="sm">
              Mag-login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
