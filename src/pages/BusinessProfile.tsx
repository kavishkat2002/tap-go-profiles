import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Mail, Globe, MapPin, Store, Loader2 } from "lucide-react";
import { fetchProfileBySlug, incrementViews } from "@/lib/api";
import { useEffect } from "react";

export default function BusinessProfile() {
  const { business } = useParams();

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="card-elevated overflow-hidden">
          <div className="hero-gradient h-32" />
          <CardContent className="relative -mt-10 pb-6">
            <div className="h-16 w-16 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
            {profile.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <MapPin className="h-4 w-4" /> {profile.address}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 grid grid-cols-3 gap-2">
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
          </CardContent>
        </Card>

        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer">
            <Card className="card-elevated">
              <CardContent className="p-4 flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm">{profile.website.replace(/https?:\/\//, "")}</span>
              </CardContent>
            </Card>
          </a>
        )}

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
