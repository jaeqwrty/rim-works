export const SiteFooter = () => (
  <footer className="border-t border-border/60 mt-24">
    <div className="container py-10 grid md:grid-cols-3 gap-8 text-sm">
      <div>
        <div className="font-display font-bold text-lg mb-2">RimWorks<span className="text-primary">.</span>PH</div>
        <p className="text-muted-foreground">Premium custom wide rims para sa Bajaj RE, minivan, at pickup truck. Made in the Philippines, built for the streets.</p>
      </div>
      <div>
        <div className="font-semibold mb-2">Contact</div>
        <p className="text-muted-foreground">📍 Quezon City, Metro Manila</p>
        <p className="text-muted-foreground">📞 0917 555 0123</p>
      </div>
      <div>
        <div className="font-semibold mb-2">Bayad</div>
        <p className="text-muted-foreground">GCash, Maya, Bank Transfer</p>
        <p className="text-muted-foreground">Cash on pickup pwede rin.</p>
      </div>
    </div>
    <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} RimWorks PH. All rights reserved.
    </div>
  </footer>
);
