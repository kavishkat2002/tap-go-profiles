import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, MessageCircle, Mail, MapPin, Globe,
  UtensilsCrossed, Loader2, Facebook, Instagram, Twitter, Linkedin, Pencil
} from "lucide-react";
import { fetchProfileBySlug, fetchMenuForProfile, incrementViews } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ThemeDrawer from "@/components/ThemeDrawer";

export default function RestaurantProfile() {
  const { restaurant } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", restaurant],
    queryFn: () => fetchProfileBySlug(restaurant!),
    enabled: !!restaurant,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["menu", profile?.id],
    queryFn: () => fetchMenuForProfile(profile!.id),
    enabled: !!profile,
  });

  useEffect(() => {
    if (restaurant) incrementViews(restaurant);
  }, [restaurant]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.type !== "restaurant") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Restaurant not found.</p>
      </div>
    );
  }

  // Build contact buttons array dynamically
  const contactButtons = [
    profile.phone    && { href: `tel:${profile.phone}`,                              icon: <Phone className="h-5 w-5 text-primary" />,          label: "Call" },
    profile.whatsapp && { href: `https://wa.me/${profile.whatsapp.replace(/\+/g,"")}`, icon: <MessageCircle className="h-5 w-5 text-primary" />,    label: "WhatsApp", external: true },
    profile.email    && { href: `mailto:${profile.email}`,                            icon: <Mail className="h-5 w-5 text-primary" />,            label: "Email" },
    profile.website  && { href: profile.website,                                      icon: <Globe className="h-5 w-5 text-primary" />,           label: "Website", external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; external?: boolean }[];

  // Social links
  const socials = [
    profile.facebook  && { href: profile.facebook,  icon: <Facebook  className="h-4 w-4" />, label: "Facebook"  },
    profile.instagram && { href: profile.instagram, icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
    profile.twitter   && { href: profile.twitter,   icon: <Twitter   className="h-4 w-4" />, label: "Twitter"   },
    profile.linkedin  && { href: profile.linkedin,  icon: <Linkedin  className="h-4 w-4" />, label: "LinkedIn"  },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const isOwner = !!user && profile.user_id === user.id;

  return (
    <div id="profile-wrapper" className={`min-h-screen bg-background p-4 ${profile.bg_theme || ''} ${profile.theme || ''}`}>
      <div className="max-w-lg mx-auto space-y-4">
        {/* ── Owner edit button ── */}
        {isOwner && (
          <div className="flex justify-end gap-2">
            <ThemeDrawer profile={profile} />
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
                <UtensilsCrossed className="h-8 w-8 text-primary" />
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

        {/* ── Menu ── */}
        {categories.length > 0 && (
          <Card className="card-elevated">
            <CardContent className="p-5">
              <h2 className="font-display text-lg font-semibold mb-4">Menu</h2>
              <Tabs defaultValue={categories[0]?.id}>
                <TabsList className="w-full justify-start overflow-x-auto mb-4 flex-wrap h-auto gap-1">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-3">
                    {(cat as any).items.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                        {/* Item image — real photo or placeholder */}
                        <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center border border-border">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // If image fails to load, show placeholder
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:1.75rem">🍽️</span>';
                              }}
                            />
                          ) : (
                            <span className="text-2xl select-none">🍽️</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <span className="font-display font-semibold text-primary text-sm ml-2 shrink-0">
                          Rs. {Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
