import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Plus, Eye, QrCode, LogOut, Loader2 } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfiles } from "@/lib/api";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const baseUrl = window.location.origin;

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["user-profiles", user?.id],
    queryFn: () => fetchUserProfiles(user!.id),
    enabled: !!user,
  });

  const totalViews = profiles.reduce((s, p) => s + (p.views ?? 0), 0);

  const pathFor = (p: typeof profiles[0]) =>
    p.type === "personal" ? `/u/${p.slug}` : p.type === "business" ? `/b/${p.slug}` : `/r/${p.slug}`;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" />
            SmartTap
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your digital profiles</p>
          </div>
          <Button asChild>
            <Link to="/create-profile"><Plus className="h-4 w-4 mr-2" /> New Profile</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="card-elevated">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{profiles.length}</p>
                  <p className="text-xs text-muted-foreground">Active Profiles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">NFC</p>
                  <p className="text-xs text-muted-foreground">Ready to Connect</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles */}
        <Card className="card-elevated mb-8">
          <CardHeader>
            <CardTitle className="font-display text-lg">Your Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No profiles yet. Create your first one!</p>
                <Button asChild>
                  <Link to="/create-profile"><Plus className="h-4 w-4 mr-2" /> Create Profile</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => (
                  <div key={p.id} className="relative group">
                    <ProfileCard profile={p} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="secondary" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="font-display">QR Code — {p.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <QRCodeDisplay url={`${baseUrl}${pathFor(p)}`} />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mt-2">
                              <strong>NFC:</strong> Write this URL to your NFC tag:
                            </p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block break-all">
                              {baseUrl}{pathFor(p)}
                            </code>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
