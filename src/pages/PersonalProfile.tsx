import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Mail, Globe, Facebook, Instagram, Linkedin, Twitter, Download, User } from "lucide-react";
import { DEMO_PROFILES } from "@/lib/types";
import { downloadVCard } from "@/lib/vcard";

export default function PersonalProfile() {
  const { username } = useParams();
  const profile = DEMO_PROFILES.find((p) => p.slug === username && p.type === "personal");

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const socialIcons = [
    { key: "facebook", icon: Facebook, url: profile.socialLinks?.facebook },
    { key: "instagram", icon: Instagram, url: profile.socialLinks?.instagram },
    { key: "linkedin", icon: Linkedin, url: profile.socialLinks?.linkedin },
    { key: "twitter", icon: Twitter, url: profile.socialLinks?.twitter },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm card-elevated overflow-hidden">
        <div className="hero-gradient h-28" />
        <CardContent className="relative -mt-12 text-center pb-8">
          <div className="h-20 w-20 rounded-full bg-primary/20 border-4 border-card flex items-center justify-center mx-auto mb-3">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">{profile.description}</p>

          {/* Contact buttons */}
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

          {/* Social */}
          {socialIcons.length > 0 && (
            <div className="flex justify-center gap-3 mb-5">
              {socialIcons.map(({ key, icon: Icon, url }) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Icon className="h-4 w-4" />
                  </Button>
                </a>
              ))}
            </div>
          )}

          <Button className="w-full" onClick={() => downloadVCard(profile)}>
            <Download className="h-4 w-4 mr-2" /> Save Contact
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
