import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  fetchAllProfiles, updateProfile 
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, ShieldAlert, CheckCircle, 
  Ban, ShieldCheck, Loader2, ArrowLeft, ExternalLink, Search,
  Settings, CreditCard, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ProfileFooter from "@/components/ProfileFooter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: fetchAllProfiles,
  });

  const handleBlockUser = async (profileId: string, isBlocked: boolean) => {
    try {
      await updateProfile(profileId, { is_blocked: !isBlocked } as any);
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({ 
        title: isBlocked ? "Account Restored" : "Account Suspended", 
        description: `User access has been ${isBlocked ? "re-enabled" : "revoked"}.` 
      });
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    }
  };

  const handleTogglePremium = async (profileId: string, currentStatus: boolean) => {
    try {
      // Assuming a 'is_premium' column exists or adding it as custom behavior
      await updateProfile(profileId, { is_premium: !currentStatus } as any);
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({ 
        title: currentStatus ? "Premium Disabled" : "Premium Enabled", 
        description: `Account feature set updated.` 
      });
    } catch (err: any) {
      toast({ title: "Update failed", description: "You need to add 'is_premium' column to profiles table first.", variant: "destructive" });
    }
  };

  // Filter profiles
  const filteredProfiles = profiles?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profilesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userProfile = profiles?.find(p => p.user_id === user?.id) as any;
  const isAdmin = userProfile?.is_admin === true;
  const isDeveloper = [
    "kavishkat2002@gmail.com",
    "kavishka.social@gmail.com",
    "tkavishka101@gmail.com"
  ].includes(user?.email?.toLowerCase() || "");

  if (!user || (!isAdmin && !isDeveloper)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md text-center py-12">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">SaaS Admin Access Denied</h1>
            <p className="text-muted-foreground mb-4">You do not have administrative privileges to access this console.</p>
            <div className="bg-muted p-2 rounded text-[10px] mb-6 font-mono text-left">
                Logged in as: {user?.email}<br/>
                Role: PLATFORM_OWNER_REQUIRED
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold flex items-center gap-2">
                SaaS Central <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">CreativeX</Badge>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* SaaS Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="card-elevated border-none bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-primary/60">Total Subscriptions</p>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-4xl font-bold">{profiles?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600/60">Global Reach</p>
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-4xl font-bold">{profiles?.reduce((s, p) => s + (p.views || 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total Profile Views</p>
            </CardContent>
          </Card>
          <Card className="card-elevated border-none bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600/60">System Health</p>
                <CheckCircle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-4xl font-bold font-display uppercase tracking-tighter text-amber-600">Active</p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-artistic border-none overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Account Management</CardTitle>
                <CardDescription>Handle user access, subscription types, and system-wide blocks.</CardDescription>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, slug or email..." 
                  className="pl-9 bg-background/50" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px]">Profile</TableHead>
                  <TableHead>Creator Details</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Platform Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles?.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                            {profile.image_url ? (
                                <img src={profile.image_url} className="h-full w-full object-cover" />
                            ) : (
                                <Users className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{profile.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate opacity-70">@{profile.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">{profile.email || "No Email"}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-muted-foreground">{profile.phone || "No Phone"}</p>
                           <span className="text-[10px] text-muted-foreground opacity-30">•</span>
                           <p className="text-[10px] text-muted-foreground">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] bg-background">
                        {profile.type} profile
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(profile as any).is_blocked ? (
                        <Badge variant="destructive" className="gap-1 px-1.5 py-0">
                          <Ban className="h-3 w-3" /> Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1 px-1.5 py-0 font-medium">
                          <ShieldCheck className="h-3 w-3" /> Enabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(profile as any).is_premium ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 px-1.5 py-0">
                          <Zap className="h-3 w-3" /> Premium
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1 px-1.5 py-0">
                          Free Tier
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="View Public Profile">
                          <Link to={profile.type === 'restaurant' ? `/r/${profile.slug}` : profile.type === 'business' ? `/b/${profile.slug}` : `/u/${profile.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={(profile as any).is_premium ? "text-amber-500" : "text-muted-foreground"}
                            onClick={() => handleTogglePremium(profile.id, (profile as any).is_premium)}
                            title="Toggle Premium Status"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={(profile as any).is_blocked ? "text-green-600" : "text-destructive"}
                            onClick={() => handleBlockUser(profile.id, (profile as any).is_blocked)}
                            title={(profile as any).is_blocked ? "Activate Account" : "Suspend Account"}
                        >
                          {(profile as any).is_blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <ProfileFooter />
    </div>
  );
}
