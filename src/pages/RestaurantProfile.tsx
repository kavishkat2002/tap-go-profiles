import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, MessageCircle, Mail, MapPin, UtensilsCrossed, Loader2 } from "lucide-react";
import { fetchProfileBySlug, fetchMenuForProfile, incrementViews } from "@/lib/api";
import { useEffect } from "react";

export default function RestaurantProfile() {
  const { restaurant } = useParams();

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="card-elevated overflow-hidden">
          <div className="hero-gradient h-32" />
          <CardContent className="relative -mt-10 pb-6">
            <div className="h-16 w-16 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
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

        {categories.length > 0 && (
          <Card className="card-elevated">
            <CardContent className="p-5">
              <h2 className="font-display text-lg font-semibold mb-4">Menu</h2>
              <Tabs defaultValue={categories[0]?.id}>
                <TabsList className="w-full justify-start overflow-x-auto mb-4">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-3">
                    {cat.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <span className="font-display font-semibold text-primary text-sm ml-3">
                          ${Number(item.price).toFixed(2)}
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
