import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Mail, Globe, Facebook, Instagram, Linkedin, Twitter, Download, User, Loader2, Pencil } from "lucide-react";
import { fetchProfileBySlug, incrementViews } from "@/lib/api";
import { downloadVCard } from "@/lib/vcard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ThemeDrawer from "@/components/ThemeDrawer";
import SuspendedView from "@/components/SuspendedView";
import ProfileFooter from "@/components/ProfileFooter";
import { supabase } from "@/integrations/supabase/client";

export default function PersonalProfile() {
  const { username } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileBySlug(username!),
    enabled: !!username,
  });

  // Listen for real-time updates to status (blocking/unblocking)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`profile-status-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new.is_blocked !== payload.old.is_blocked) {
            refetchProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, refetchProfile]);

  useEffect(() => {
    if (username) incrementViews(username);
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.type !== "personal") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  if ((profile as any).is_blocked) {
    return <SuspendedView />;
  }

  const socialIcons = [
    { key: "facebook", icon: Facebook, url: profile.facebook },
    { key: "instagram", icon: Instagram, url: profile.instagram },
    { key: "linkedin", icon: Linkedin, url: profile.linkedin },
    { key: "twitter", icon: Twitter, url: profile.twitter },
  ].filter((s) => s.url);

  const vcardProfile = {
    ...profile,
    socialLinks: {
      facebook: profile.facebook ?? undefined,
      instagram: profile.instagram ?? undefined,
      linkedin: profile.linkedin ?? undefined,
      twitter: profile.twitter ?? undefined,
    },
  };

  return (
    <div
      id="profile-wrapper"
      className={`min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-start sm:justify-center px-3 sm:px-4 py-6 sm:py-8 gap-4 sm:gap-6 relative ${profile.bg_theme || ''} ${profile.theme || ''}`}
    >
      {/* Decorative blobs — clipped inside overflow-x-hidden parent */}
      <div className="fixed top-1/4 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />

      {/* Owner actions */}
      {!!user && profile.user_id === user.id && (
        <div className="w-full max-w-sm flex justify-end gap-2">
          <ThemeDrawer profile={profile} />
          <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm">
            <Link to={`/edit/${profile.slug}`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Link>
          </Button>
        </div>
      )}

      <Card className="w-full max-w-sm card-artistic overflow-hidden">
        {/* Cover */}
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="h-24 sm:h-28 w-full object-cover" />
        ) : (
          <div className="hero-gradient h-24 sm:h-28" />
        )}

        <CardContent className="relative -mt-10 sm:-mt-12 text-center px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Avatar */}
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-card mx-auto mb-3 shadow-lg"
            />
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 border-4 border-card flex items-center justify-center mx-auto mb-3 shadow-lg">
              <User className="h-9 w-9 sm:h-10 sm:w-10 text-primary" />
            </div>
          )}

          <h1 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-1.5 leading-tight">
            {profile.name}
            <VerifiedBadge />
          </h1>
          {profile.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4 leading-relaxed px-2">{profile.description}</p>
          )}

          {/* Contact grid — 3‑up on most phones */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {profile.phone && (
              <a href={`tel:${profile.phone}`}>
                <Button variant="outline" className="w-full flex-col h-auto py-2.5 sm:py-3 gap-1">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-[11px] sm:text-xs">Call</span>
                </Button>
              </a>
            )}
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp.replace(/\+/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full flex-col h-auto py-2.5 sm:py-3 gap-1">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-[11px] sm:text-xs">WhatsApp</span>
                </Button>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <Button variant="outline" className="w-full flex-col h-auto py-2.5 sm:py-3 gap-1">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="text-[11px] sm:text-xs">Email</span>
                </Button>
              </a>
            )}
          </div>

          {/* Website link */}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-primary hover:underline mb-4 truncate px-2"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{profile.website.replace(/https?:\/\//, "")}</span>
            </a>
          )}

          {/* Social icons */}
          {socialIcons.length > 0 && (
            <div className="flex justify-center gap-2.5 mb-4 flex-wrap">
              {socialIcons.map(({ key, icon: Icon, url }) => (
                <a key={key} href={url!} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </a>
              ))}
            </div>
          )}

          <Button className="w-full h-10 sm:h-11 text-sm sm:text-base" onClick={() => downloadVCard(vcardProfile as any)}>
            <Download className="h-4 w-4 mr-2" /> Save Contact
          </Button>
        </CardContent>
      </Card>
      <ProfileFooter />
    </div>
  );
}
