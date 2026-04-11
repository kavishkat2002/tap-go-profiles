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
    profile.phone    && { href: `tel:${profile.phone}`,                               icon: <Phone className="h-5 w-5 text-primary" />,        label: "Call" },
    profile.whatsapp && { href: `https://wa.me/${profile.whatsapp.replace(/\+/g,"")}`, icon: <MessageCircle className="h-5 w-5 text-primary" />, label: "WhatsApp", external: true },
    profile.email    && { href: `mailto:${profile.email}`,                             icon: <Mail className="h-5 w-5 text-primary" />,          label: "Email" },
    profile.website  && { href: profile.website,                                       icon: <Globe className="h-5 w-5 text-primary" />,         label: "Website", external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; external?: boolean }[];

  const socials = [
    profile.facebook  && { href: profile.facebook,  icon: <Facebook  className="h-4 w-4" />, label: "Facebook"  },
    profile.instagram && { href: profile.instagram, icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
    profile.twitter   && { href: profile.twitter,   icon: <Twitter   className="h-4 w-4" />, label: "Twitter"   },
    profile.linkedin  && { href: profile.linkedin,  icon: <Linkedin  className="h-4 w-4" />, label: "LinkedIn"  },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const isOwner = !!user && profile.user_id === user.id;

  return (
    <div className={`min-h-screen bg-background p-4 ${profile.theme || ''}`}>
      <div className="max-w-lg mx-auto space-y-4">
        {/* ── Owner edit button ── */}
        {isOwner && (
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link to={`/edit/${profile.slug}`}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Profile
              </Link>
            </Button>
          </div>
        )}

        {/* ── Hero card ── */}
        <Card className="card-elevated overflow-hidden">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="h-32 w-full object-cover" />
          ) : (
            <div className="hero-gradient h-32" />
          )}
          <CardContent className="relative -mt-10 pb-6">
            {profile.image_url ? (
              <img
                src={profile.image_url}
                alt={profile.name}
                className="h-20 w-20 rounded-xl object-cover border-4 border-card mb-3 shadow"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold flex items-center gap-1.5">
              {profile.name}
              <VerifiedBadge />
            </h1>
            {profile.description && (
              <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
            )}
            {profile.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <MapPin className="h-4 w-4 shrink-0" /> {profile.address}
              </div>
            )}

            {/* Social badges */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                      {s.icon}
                      <span className="text-xs">{s.label}</span>
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Contact buttons ── */}
        {contactButtons.length > 0 && (
          <Card className="card-elevated">
            <CardContent className={`p-4 grid gap-2 ${contactButtons.length <= 2 ? "grid-cols-2" : contactButtons.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {contactButtons.map((btn) => (
                <a key={btn.label} href={btn.href} target={btn.external ? "_blank" : undefined} rel={btn.external ? "noopener noreferrer" : undefined}>
                  <Button variant="outline" className="w-full flex-col h-auto py-3 gap-1">
                    {btn.icon}
                    <span className="text-xs">{btn.label}</span>
                  </Button>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Services ── */}
        {profile.services && profile.services.length > 0 && (
          <Card className="card-elevated">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
