import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  fetchAllProfiles, updateProfile, fetchAllProfileRequests, updateProfileRequest, deleteProfile
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, ShieldAlert, CheckCircle, 
  Ban, ShieldCheck, Loader2, ArrowLeft, ExternalLink, Search,
  Settings, CreditCard, Zap, Clock, CheckCircle2, XCircle, User, Store, UtensilsCrossed,
  Package, Image, Eye, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ProfileFooter from "@/components/ProfileFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: fetchAllProfiles,
  });

  const { data: profileRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["admin", "profile-requests"],
    queryFn: fetchAllProfileRequests,
  });

  const pendingRequests = profileRequests.filter(r => r.status === "pending");

  const handleBlockUser = async (profileId: string, isBlocked: boolean) => {
    try {
      await updateProfile(profileId, { is_blocked: !isBlocked });
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
      await updateProfile(profileId, { is_premium: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({ 
        title: currentStatus ? "Premium Disabled" : "Premium Enabled", 
        description: `Account feature set updated.` 
      });
    } catch (err: any) {
      toast({ title: "Update failed", description: "You need to add 'is_premium' column to profiles table first.", variant: "destructive" });
    }
  };

  const handleApproveRequest = async (request: any) => {
    try {
      const slug = request.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      
      // Use RPC to create profile under the requesting user's account (bypasses RLS)
      const { error: rpcError } = await supabase.rpc("admin_create_profile", {
        p_user_id: request.user_id,
        p_name: request.name,
        p_slug: uniqueSlug,
        p_type: request.profile_type,
        p_email: request.email,
        p_phone: request.phone,
        p_address: request.address,
      });
      if (rpcError) throw rpcError;

      await updateProfileRequest(request.id, { status: "approved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "profile-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast({ title: "Request Approved", description: `Profile created for ${request.name}.` });
    } catch (err: any) {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateProfileRequest(requestId, { status: "rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin", "profile-requests"] });
      toast({ title: "Request Rejected", description: "The profile request has been declined." });
    } catch (err: any) {
      toast({ title: "Rejection failed", description: err.message, variant: "destructive" });
    }
  };

  // Filter profiles
  const filteredProfiles = profiles?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profilesLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userProfile = profiles?.find(p => p.user_id === user?.id);
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

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="requests" className="text-sm font-bold gap-2 relative">
              <Package className="h-4 w-4" /> Profile Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-sm font-bold gap-2">
              <Users className="h-4 w-4" /> Account Management
            </TabsTrigger>
          </TabsList>

          {/* ── Profile Requests Tab ── */}
          <TabsContent value="requests">
            <Card className="card-artistic border-none overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-lg">Profile Requests</CardTitle>
                <CardDescription>Review incoming profile creation requests, verify payments, and approve or reject.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {profileRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No profile requests yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {profileRequests.map((req) => (
                      <div key={req.id} className={`p-4 sm:p-5 transition-colors ${
                        req.status === "pending" ? "bg-amber-50/30" : ""
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                              req.profile_type === "personal" ? "bg-blue-100" : req.profile_type === "business" ? "bg-emerald-100" : "bg-orange-100"
                            }`}>
                              {req.profile_type === "personal" ? <User className="h-5 w-5 text-blue-600" /> :
                               req.profile_type === "business" ? <Store className="h-5 w-5 text-emerald-600" /> :
                               <UtensilsCrossed className="h-5 w-5 text-orange-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold">{req.name}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <span className="text-[11px] text-muted-foreground">{req.email}</span>
                                <span className="text-[11px] text-muted-foreground">{req.phone}</span>
                                {req.address && <span className="text-[11px] text-muted-foreground">{req.address}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="capitalize text-[10px] bg-background">{req.profile_type}</Badge>
                                <Badge variant="outline" className="capitalize text-[10px] bg-primary/5 text-primary border-primary/20">{req.package} package</Badge>
                                <span className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {req.payment_slip_url && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-xs gap-1">
                                    <Eye className="h-3 w-3" /> Slip
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Payment Slip — {req.name}</DialogTitle>
                                  </DialogHeader>
                                  <img src={req.payment_slip_url} alt="Payment Slip" className="w-full rounded-xl border" />
                                </DialogContent>
                              </Dialog>
                            )}

                            {req.status === "pending" ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="text-xs gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveRequest(req)}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs gap-1"
                                  onClick={() => handleRejectRequest(req.id)}
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline" className={`gap-1 px-2 py-0.5 text-[10px] ${
                                req.status === "approved" ? "text-green-600 border-green-200 bg-green-50" :
                                "text-red-600 border-red-200 bg-red-50"
                              }`}>
                                {req.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {req.status === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Account Management Tab ── */}
          <TabsContent value="accounts">
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
                      {profile.is_blocked ? (
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
                      {profile.is_premium ? (
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
                            className={profile.is_premium ? "text-amber-500" : "text-muted-foreground"}
                            onClick={() => handleTogglePremium(profile.id, profile.is_premium)}
                            title="Toggle Premium Status"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={profile.is_blocked ? "text-green-600" : "text-destructive"}
                            onClick={() => handleBlockUser(profile.id, profile.is_blocked)}
                            title={profile.is_blocked ? "Activate Account" : "Suspend Account"}
                        >
                          {profile.is_blocked ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (!confirm(`Delete profile "${profile.name}"? This cannot be undone.`)) return;
                              try {
                                await deleteProfile(profile.id);
                                queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
                                toast({ title: "Profile Deleted", description: `${profile.name} has been removed.` });
                              } catch (err: any) {
                                toast({ title: "Delete failed", description: err.message, variant: "destructive" });
                              }
                            }}
                            title="Delete Profile"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ProfileFooter />
    </div>
  );
}
