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

export default function BusinessProfile() {
  const { business } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", business],
    queryFn: () => fetchProfileBySlug(business!),
    enabled: !!business,
  });

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
    </div>
  );
}
