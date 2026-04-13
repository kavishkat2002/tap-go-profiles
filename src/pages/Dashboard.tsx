import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Plus, Eye, QrCode, LogOut, Loader2, ShoppingBag, Clock, CheckCircle2, XCircle, User, Store, UtensilsCrossed, Trash2 } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserProfiles, fetchUserProfileRequests, deleteProfile } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const baseUrl = window.location.origin;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["user-profiles", user?.id],
    queryFn: () => fetchUserProfiles(user!.id),
    enabled: !!user,
  });

  const { data: profileRequests = [] } = useQuery({
    queryKey: ["profile-requests", user?.id],
    queryFn: () => fetchUserProfileRequests(user!.id),
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
          <div className="flex items-center gap-3">
            {[
              "kavishkat2002@gmail.com",
              "kavishka.social@gmail.com",
              "tkavishka101@gmail.com"
            ].includes(user?.email?.toLowerCase() || "") && (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link to="/admin">Admin Console</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your digital profiles</p>
          </div>
          <Button asChild>
            <Link to="/request-profile"><Plus className="h-4 w-4 mr-2" /> New Profile</Link>
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
                <p className="text-muted-foreground mb-4">No profiles yet. Request your first one!</p>
                <Button asChild>
                  <Link to="/request-profile"><Plus className="h-4 w-4 mr-2" /> Request Profile</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((p) => (
                  <div key={p.id} className="relative group">
                    <ProfileCard profile={p} />
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm">
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
                      
                      {p.type === 'restaurant' && (
                        <Button size="icon" variant="secondary" asChild className="h-8 w-8 shadow-sm bg-primary/10 hover:bg-primary/20 text-primary border-none">
                          <Link to={`/orders/${p.slug}`} title="Manage Orders">
                            <ShoppingBag className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}

                      {/* Delete Profile */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm bg-destructive/10 hover:bg-destructive/20 text-destructive border-none">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="font-display">Delete Profile</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Are you sure you want to delete <strong>{p.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                className="flex-1" 
                                disabled={deletingId === p.id}
                                onClick={async () => {
                                  setDeletingId(p.id);
                                  try {
                                    await deleteProfile(p.id);
                                    queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
                                  } catch (err: any) {
                                    console.error(err);
                                  } finally {
                                    setDeletingId(null);
                                  }
                                }}
                              >
                                {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" /> Delete</>}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Requests */}
        {profileRequests.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="font-display text-lg">Your Profile Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      req.profile_type === "personal" ? "bg-blue-100" : req.profile_type === "business" ? "bg-emerald-100" : "bg-orange-100"
                    }`}>
                      {req.profile_type === "personal" ? <User className="h-4 w-4 text-blue-600" /> :
                       req.profile_type === "business" ? <Store className="h-4 w-4 text-emerald-600" /> :
                       <UtensilsCrossed className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{req.profile_type} • {req.package} package • {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    req.status === "approved" ? "text-green-700 bg-green-100" :
                    req.status === "rejected" ? "text-red-700 bg-red-100" :
                    "text-amber-700 bg-amber-100"
                  }`}>
                    {req.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> :
                     req.status === "rejected" ? <XCircle className="h-3 w-3" /> :
                     <Clock className="h-3 w-3" />}
                    <span className="capitalize">{req.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
