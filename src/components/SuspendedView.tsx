import { ShieldAlert, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function SuspendedView() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center py-12 px-6 border-none shadow-2xl bg-card/50 backdrop-blur-xl">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-10 w-10 text-destructive animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Profile Suspended</h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          This digital profile has been temporarily suspended by the platform administrator for review.
        </p>
        
        <div className="bg-destructive/5 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 border border-destructive/10">
            <Phone className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold text-destructive">Contact: 0703375336</span>
        </div>

        <div className="flex flex-col gap-3">
            <Button asChild className="w-full h-11 rounded-xl font-bold">
                <Link to="/">Explore SmartTap</Link>
            </Button>
            
            {user && (
              <Button variant="ghost" asChild className="gap-2 text-muted-foreground">
                  <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
              </Button>
            )}
        </div>
      </Card>
    </div>
  );
}
