import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone, MessageCircle, Mail, Globe, MapPin, Store, Loader2,
  Facebook, Instagram, Twitter, Linkedin, Pencil
} from "lucide-react";
import { fetchProfileBySlug, incrementViews } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ThemeDrawer from "@/components/ThemeDrawer";
import SuspendedView from "@/components/SuspendedView";
import ProfileFooter from "@/components/ProfileFooter";
import { supabase } from "@/integrations/supabase/client";

export default function BusinessProfile() {
  const { business } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", business],
    queryFn: () => fetchProfileBySlug(business!),
    enabled: !!business,
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
    if (business) incrementViews(business);
  }, [business]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.type !== "business") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    );
  }

  if ((profile as any).is_blocked) {
    return <SuspendedView />;
  }

  const contactButtons = [
    profile.phone    && { href: `tel:${profile.phone}`,                              icon: <Phone className="h-5 w-5 text-primary" />,       label: "Call" },
    profile.whatsapp && { href: `https://wa.me/${profile.whatsapp.replace(/\+/g, "")}`, icon: <MessageCircle className="h-5 w-5 text-primary" />, label: "WhatsApp", external: true },
    profile.email    && { href: `mailto:${profile.email}`,                            icon: <Mail className="h-5 w-5 text-primary" />,         label: "Email" },
    profile.website  && { href: profile.website,                                      icon: <Globe className="h-5 w-5 text-primary" />,        label: "Website", external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; external?: boolean }[];

  const socials = [
    profile.facebook  && { href: profile.facebook,  icon: <Facebook  className="h-4 w-4" />, label: "Facebook"  },
    profile.instagram && { href: profile.instagram, icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
    profile.twitter   && { href: profile.twitter,   icon: <Twitter   className="h-4 w-4" />, label: "Twitter"   },
    profile.linkedin  && { href: profile.linkedin,  icon: <Linkedin  className="h-4 w-4" />, label: "LinkedIn"  },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const isOwner = !!user && profile.user_id === user.id;

  return (
    <div
      id="profile-wrapper"
      className={`min-h-screen w-full overflow-x-hidden px-3 sm:px-4 pb-10 pt-5 sm:pt-8 flex flex-col items-center ${profile.bg_theme || ''} ${profile.theme || ''}`}
    >
      <div className="w-full max-w-md sm:max-w-lg space-y-4 sm:space-y-6">

        {/* Owner actions */}
        {isOwner && (
          <div className="flex justify-end gap-2">
            <ThemeDrawer profile={profile} />
            <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm">
              <Link to={`/edit/${profile.slug}`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Link>
            </Button>
          </div>
        )}

        {/* Hero card */}
        <Card className="card-artistic overflow-hidden">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="h-28 sm:h-36 w-full object-cover" />
          ) : (
            <div className="hero-gradient h-28 sm:h-36" />
          )}

          <CardContent className="relative -mt-10 sm:-mt-12 px-4 sm:px-6 pb-5 sm:pb-6">
            {profile.image_url ? (
              <img
                src={profile.image_url}
                alt={profile.name}
                className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-xl object-cover border-4 border-card mb-3 shadow"
              />
            ) : (
              <div className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
                <Store className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
            )}

            <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-1.5 leading-tight">
              {profile.name}
              <VerifiedBadge />
            </h1>
            {profile.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{profile.description}</p>
            )}
            {profile.address && (
              <div className="flex items-start gap-1.5 text-xs sm:text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {profile.address}
              </div>
            )}

            {/* Social badges */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1 text-[11px] cursor-pointer hover:bg-primary/10 transition-colors">
                      {s.icon}
                      <span>{s.label}</span>
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </CardContent>

          {/* Business Gallery */}
          {profile.gallery && (profile.gallery as string[]).length > 0 && (
            <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Gallery</p>
              <div className="grid grid-cols-3 gap-2">
                {(profile.gallery as string[]).map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/40 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Contact buttons */}
        {contactButtons.length > 0 && (
          <Card className="card-artistic">
            <CardContent className={`p-3 sm:p-4 grid gap-2 ${contactButtons.length <= 2 ? "grid-cols-2" : contactButtons.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
              {contactButtons.map((btn) => (
                <a
                  key={btn.label}
                  href={btn.href}
                  target={btn.external ? "_blank" : undefined}
                  rel={btn.external ? "noopener noreferrer" : undefined}
                >
                  <Button variant="outline" className="w-full flex-col h-auto py-2.5 sm:py-3 gap-1">
                    {btn.icon}
                    <span className="text-[11px] sm:text-xs">{btn.label}</span>
                  </Button>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Google Reviews */}
        {(profile as any).google_review_url && (
          <a
            href={(profile as any).google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="card-artistic border-0 overflow-hidden cursor-pointer group hover:-translate-y-0.5 transition-transform">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white shadow flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Leave a Google Review</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Share your experience to help others</p>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        )}

        {/* Services */}
        {profile.services && profile.services.length > 0 && (
          <Card className="card-artistic">
            <CardContent className="p-4 sm:p-5">
              <h2 className="font-display text-sm sm:text-base font-semibold mb-3">Services</h2>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {profile.services.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs sm:text-sm">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProfileFooter />
    </div>
  );
}
