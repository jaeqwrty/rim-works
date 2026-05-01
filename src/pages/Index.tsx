import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { heroRim } from "@/lib/images";
import { VEHICLE_LABELS, VEHICLE_TAGLINES, VehicleType } from "@/lib/constants";
import { ArrowRight, Sparkles, Truck, Bike, Car, ShieldCheck, Clock, Wrench } from "lucide-react";

const VEHICLE_ICONS: Record<VehicleType, typeof Bike> = {
  bajaj_re: Bike,
  minivan: Car,
  pickup_truck: Truck,
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="container grid lg:grid-cols-2 gap-12 py-16 lg:py-24 items-center">
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Bagong design. Bagong dating.
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                Pasadyang <span className="text-gradient-chrome">Wide Rims</span>
                <br />for the Filipino road.
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                I-design ang sariling rim mo online — pumili ng size, finish, kulay, at design. Tingnan agad ang itsura bago mo i-book.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:shadow-elegant text-base">
                  <a href="#vehicles">Mag-customize Na <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/orders">Track Order</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 1-year warranty</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 3-5 days install</div>
                <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Pinoy expert team</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full" />
              <img
                src={heroRim}
                alt="Premium custom chrome wide rim with electric blue accent lighting"
                width={1536} height={1024}
                className="relative rounded-2xl border border-border/60 shadow-elegant"
              />
            </div>
          </div>
        </section>

        {/* VEHICLE SELECT */}
        <section id="vehicles" className="container py-20">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Piliin ang sasakyan mo</h2>
            <p className="text-muted-foreground">Bawat vehicle, may sariling lineup ng rims na kasya at bagay.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => {
              const Icon = VEHICLE_ICONS[v];
              return (
                <Link
                  key={v}
                  to={`/configure/${v}`}
                  className="group relative rounded-2xl bg-gradient-card p-8 border border-border/60 hover:border-primary/50 transition-smooth shadow-card-soft hover:shadow-elegant metallic-border overflow-hidden"
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/15 transition-smooth" />
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl bg-secondary grid place-items-center mb-5 group-hover:bg-primary/20 transition-smooth">
                      <Icon className="h-7 w-7 text-primary" strokeWidth={2} />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{VEHICLE_TAGLINES[v]}</div>
                    <h3 className="font-display text-2xl font-bold mb-2">{VEHICLE_LABELS[v]}</h3>
                    <p className="text-sm text-muted-foreground mb-5">I-customize ang rims na bagay sa {VEHICLE_LABELS[v]} mo.</p>
                    <div className="inline-flex items-center text-primary text-sm font-semibold group-hover:gap-3 gap-2 transition-smooth">
                      Simulan ang design <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container py-20">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Pano ito gumagana?</h2>
            <p className="text-muted-foreground">Madali lang. 3 steps lang at tapos na.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Pumili ng sasakyan", d: "Bajaj RE, minivan, o pickup truck — ikaw bahala." },
              { n: "02", t: "I-customize ang rim", d: "Size, finish, kulay, at design — live preview habang nag-aayos ka." },
              { n: "03", t: "I-book at bayaran", d: "Optional ang downpayment. Pwede full payment sa shop pagdating mo." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-gradient-card p-7 border border-border/60">
                <div className="text-gradient-chrome font-display text-4xl font-bold mb-3">{s.n}</div>
                <h3 className="font-display text-xl font-bold mb-2">{s.t}</h3>
                <p className="text-muted-foreground text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
