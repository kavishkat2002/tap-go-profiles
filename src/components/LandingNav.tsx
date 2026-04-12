import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export default function LandingNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
      <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl h-14 px-4 flex items-center justify-between shadow-2xl shadow-black/5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
          <div className="h-8 w-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span className="tracking-tight">SmartTap</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl">
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild className="text-xs font-bold rounded-xl bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-4">
            <Link to="/login?tab=signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
