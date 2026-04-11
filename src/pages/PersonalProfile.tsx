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

export default function PersonalProfile() {
  const { username } = useParams();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileBySlug(username!),
    enabled: !!username,
  });

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-3">
      {/* ── Owner edit button ── */}
      {!!user && profile.user_id === user.id && (
        <div className="w-full max-w-sm flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link to={`/edit/${profile.slug}`}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Profile
            </Link>
          </Button>
        </div>
      )}
      <Card className="w-full max-w-sm card-elevated overflow-hidden">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="h-28 w-full object-cover" />
        ) : (
          <div className="hero-gradient h-28" />
        )}
        <CardContent className="relative -mt-12 text-center pb-8">
          {profile.image_url ? (
            <img 
              src={profile.image_url} 
              alt={profile.name} 
              className="h-24 w-24 rounded-full object-cover border-4 border-card mx-auto mb-3 shadow" 
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/20 border-4 border-card flex items-center justify-center mx-auto mb-3 shadow">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
          <h1 className="font-display text-xl font-bold flex items-center justify-center gap-1.5">
            {profile.name}
            <VerifiedBadge />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">{profile.description}</p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {profile.phone && (
              <a href={`tel:${profile.phone}`}>
                <Button variant="outline" className="w-full flex-col h-auto py-3 gap-1">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-xs">Call</span>
                </Button>
              </a>
            )}
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp.replace(/\+/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full flex-col h-auto py-3 gap-1">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`}>
                <Button variant="outline" className="w-full flex-col h-auto py-3 gap-1">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-xs">Email</span>
                </Button>
              </a>
            )}
          </div>

          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mb-5">
              <Globe className="h-4 w-4" /> {profile.website.replace(/https?:\/\//, "")}
            </a>
          )}

          {socialIcons.length > 0 && (
            <div className="flex justify-center gap-3 mb-5">
              {socialIcons.map(({ key, icon: Icon, url }) => (
                <a key={key} href={url!} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Icon className="h-4 w-4" />
                  </Button>
                </a>
              ))}
            </div>
          )}

          <Button className="w-full" onClick={() => downloadVCard(vcardProfile as any)}>
            <Download className="h-4 w-4 mr-2" /> Save Contact
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
