import { Link } from "react-router-dom";
import LandingNav from "@/components/LandingNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, QrCode, Users, UtensilsCrossed, ArrowRight, Zap, Globe, BarChart3 } from "lucide-react";

const features = [
  { icon: QrCode, title: "QR Code Sharing", desc: "Instantly generate QR codes for any profile. Share in seconds." },
  { icon: Smartphone, title: "NFC Ready", desc: "Write your profile URL to any NFC tag for tap-to-connect." },
  { icon: Users, title: "Multiple Profile Types", desc: "Personal cards, business pages, or restaurant menus." },
  { icon: Globe, title: "Unique URLs", desc: "Clean, SEO-friendly profile links you can share anywhere." },
  { icon: Zap, title: "Instant Setup", desc: "Create your digital profile in under 2 minutes." },
  { icon: BarChart3, title: "Analytics", desc: "Track views and engagement on your profiles." },
];

const useCases = [
  { icon: Users, title: "Personal", desc: "Digital business cards with vCard download", color: "text-primary" },
  { icon: Smartphone, title: "Business", desc: "Showcase services and contact info", color: "text-accent" },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Mobile-friendly digital menus", color: "text-primary" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="hero-gradient text-primary-foreground pt-32 pb-20 px-4">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Zap className="h-4 w-4" /> QR & NFC Digital Profiles
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Your identity,{" "}
            <span className="text-gradient">one tap away</span>
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Create stunning digital profiles for your business, restaurant, or personal brand. Share instantly via QR code or NFC.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" asChild>
              <Link to="/login?tab=signup">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" asChild>
              <Link to="/u/jane-doe">See Demo Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Built for everyone</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <Card key={uc.title} className="card-elevated text-center">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <uc.icon className={`h-7 w-7 ${uc.color}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground">{uc.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Powerful features to create, share, and manage your digital presence.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="card-elevated">
                <CardContent className="p-5">
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-display font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to go digital?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of professionals sharing their profiles with SmartTap.
          </p>
          <Button size="lg" asChild>
            <Link to="/login?tab=signup">
              Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Smartphone className="h-5 w-5 text-primary" />
            SmartTap
          </div>
          <p>© {new Date().getFullYear()} SmartTap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
