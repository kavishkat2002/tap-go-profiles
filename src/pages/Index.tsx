import { Link } from "react-router-dom";
import LandingNav from "@/components/LandingNav";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, QrCode, Users, UtensilsCrossed, 
  ArrowRight, Zap, Globe, BarChart3, 
  Layers, ShieldCheck, MousePointer2 
} from "lucide-react";
import ProfileFooter from "@/components/ProfileFooter";

export default function Index() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <LandingNav />

      {/* Hero Section - The "Bespoke" Look */}
      <main className="relative pt-40 pb-20 overflow-hidden">
        {/* Subtle Background Art */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[50%] bg-purple-400 blur-[100px] rounded-full opacity-20"></div>
        </div>

        <div className="container px-6 mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[10px] uppercase font-bold tracking-widest mb-10 animate-fade-in">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                The Future of Connection
            </div>
            
            <h1 className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-fade-in">
                Digital presence.<br/>
                <span className="text-slate-400 dark:text-slate-600">Perfectly simplified.</span>
            </h1>

            <p className="max-w-xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 font-medium leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>
                SmartTap bridge the gap between physical interaction and digital identity. 
                One tap. Unlimited possibilities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <Button size="lg" asChild className="h-14 px-8 rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 text-base font-bold shadow-2xl shadow-black/10 transition-all hover:scale-[1.02]">
                    <Link to="/login?tab=signup">
                        Create Your Card — It's Free
                    </Link>
                </Button>
                <Link to="/r/kavi-rest" className="text-sm font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 px-6 h-14 border border-black/5 dark:border-white/5 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    View Interactive Demo <MousePointer2 className="h-4 w-4" />
                </Link>
            </div>
        </div>
      </main>

      {/* Grid Features - "Real Human" Layout */}
      <section className="py-24 border-y border-black/5 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
        <div className="container px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
                
                {/* Feature 1 */}
                <div className="bg-white dark:bg-[#030303] p-10 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <QrCode className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Smart QR Engine</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Dynamic vectors that grow with you. Update your profile, your QR stays the same.</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white dark:bg-[#030303] p-10 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Smartphone className="h-6 w-6 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">NFC Integration</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Native support for NTAG213/215. Tap any phone to instantly load your profile.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white dark:bg-[#030303] p-10 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Layers className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Menu Builder</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Specifically designed for restaurants. Full digital menus with categories and items.</p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white dark:bg-[#030303] p-10 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Live Analytics</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Know exactly how many times you've been tapped. Real-time engagement tracking.</p>
                </div>

            </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-32 bg-white dark:bg-[#030303]">
          <div className="container px-6 mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="lg:w-1/2">
                      <div className="h-[500px] w-full bg-slate-100 dark:bg-white/5 rounded-[40px] border border-black/5 dark:border-white/5 relative overflow-hidden group shadow-inner">
                          {/* Image Placeholder or Mockup */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-40">
                              <Smartphone className="h-40 w-40 text-slate-300 dark:text-slate-700" />
                          </div>
                      </div>
                  </div>
                  <div className="lg:w-1/2 space-y-10">
                      <div className="space-y-4">
                          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                              Built for the <br/>
                              <span className="text-blue-500">Modern Professional.</span>
                          </h2>
                          <p className="text-lg text-slate-500 font-medium">
                              We've obsessed over the details so you don't have to. SmartTap feels like a native app on any device.
                          </p>
                      </div>

                      <div className="grid gap-6">
                          <div className="flex gap-4">
                              <div className="h-10 w-10 shrink-0 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                  <ShieldCheck className="h-5 w-5 text-white dark:text-black" />
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg mb-1">Enterprise Security</h4>
                                  <p className="text-sm text-slate-500">Your data is encrypted and stored securely on the SmarTap cloud.</p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="h-10 w-10 shrink-0 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                  <Zap className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg mb-1">Ultra Fast Load</h4>
                                  <p className="text-sm text-slate-500">Optimized for low-bandwidth situations. Taps load in under 1 second.</p>
                              </div>
                          </div>
                      </div>

                      <Button asChild variant="outline" className="h-12 border-black/10 dark:border-white/10 rounded-xl px-8 font-bold">
                          <Link to="/login?tab=signup">Get Started Now</Link>
                      </Button>
                  </div>
              </div>
          </div>
      </section>

      {/* Social CTA */}
      <section className="py-24 bg-black text-white dark:bg-white dark:text-black rounded-[60px] mx-4 my-20">
          <div className="container px-6 mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 italic">
                  Join the network.
              </h2>
              <p className="max-w-lg mx-auto mb-12 text-zinc-400 dark:text-zinc-500 font-medium">
                  Thousands of businesses already trust SmartTap for their digital transformation.
              </p>
              <Button size="lg" asChild className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 dark:bg-black dark:text-white dark:hover:bg-zinc-800 text-lg font-black transition-transform hover:scale-105">
                  <Link to="/login?tab=signup">
                      Connect Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
              </Button>
          </div>
      </section>

      <ProfileFooter />
    </div>
  );
}
