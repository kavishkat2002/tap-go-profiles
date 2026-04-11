import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Smartphone className="h-6 w-6 text-primary" />
          SmartTap
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/login?tab=signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
