import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, MessageCircle, Mail, MapPin, Globe,
  UtensilsCrossed, Loader2, Facebook, Instagram, Twitter, Linkedin, Pencil,
  PlusCircle, MinusCircle, ShoppingBag, Info
} from "lucide-react";
import { fetchProfileBySlug, fetchMenuForProfile, incrementViews, createOrder } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ThemeDrawer from "@/components/ThemeDrawer";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RestaurantProfile() {
  const { restaurant } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Ordering State
  const [cart, setCart] = useState<Record<string, { item: any; quantity: number }>>({});
  const [tableNumber, setTableNumber] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const cartItemsCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

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

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { item, quantity: (prev[item.id]?.quantity || 0) + 1 }
    }));
    toast({ title: "Added to order", description: `${item.name} added to your selection.` });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (!updated[itemId]) return prev;
      if (updated[itemId].quantity > 1) {
        updated[itemId].quantity -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      toast({ title: "Table number required", description: "Please enter your table number.", variant: "destructive" });
      return;
    }
    setOrdering(true);
    try {
      await createOrder({
        profile_id: profile!.id,
        table_number: tableNumber,
        items: cart,
        total_price: cartTotal,
        status: "pending"
      });
      setCart({});
      setOrderModalOpen(false);
      setTableNumber("");
      toast({ title: "Order placed!", description: "Sent to the kitchen successfully." });
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  const contactButtons = [
    profile.phone    && { href: `tel:${profile.phone}`,                              icon: <Phone className="h-5 w-5 text-primary" />,          label: "Call" },
    profile.whatsapp && { href: `https://wa.me/${profile.whatsapp.replace(/\+/g,"")}`, icon: <MessageCircle className="h-5 w-5 text-primary" />,    label: "WhatsApp", external: true },
    profile.email    && { href: `mailto:${profile.email}`,                            icon: <Mail className="h-5 w-5 text-primary" />,            label: "Email" },
    profile.website  && { href: profile.website,                                      icon: <Globe className="h-5 w-5 text-primary" />,           label: "Website", external: true },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; external?: boolean }[];

  const socials = [
    profile.facebook  && { href: profile.facebook,  icon: <Facebook  className="h-4 w-4" />, label: "Facebook"  },
    profile.instagram && { href: profile.instagram, icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
    profile.twitter   && { href: profile.twitter,   icon: <Twitter   className="h-4 w-4" />, label: "Twitter"   },
    profile.linkedin  && { href: profile.linkedin,  icon: <Linkedin  className="h-4 w-4" />, label: "LinkedIn"  },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const isOwner = !!user && profile.user_id === user.id;

  return (
    <div id="profile-wrapper" className={`min-h-screen p-4 flex flex-col items-center pt-8 ${profile.bg_theme || ''} ${profile.theme || ''}`}>
      <div className="w-full max-w-lg space-y-6 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />

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

        {/* Hero Card with Gallery */}
        <Card className="card-artistic overflow-hidden">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="h-32 w-full object-cover" />
          ) : (
            <div className="hero-gradient h-32" />
          )}
          <CardContent className="relative -mt-10 pb-6">
            {profile.image_url ? (
              <img src={profile.image_url} alt={profile.name} className="h-20 w-20 rounded-xl object-cover border-4 border-card mb-3 shadow" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold flex items-center gap-1.5">
              {profile.name} <VerifiedBadge />
            </h1>
            {profile.description && <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>}
            {profile.address && <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3"><MapPin className="h-4 w-4 shrink-0" /> {profile.address}</div>}

            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="px-2.5 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                      {s.icon} <span className="text-xs ml-1.5">{s.label}</span>
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </CardContent>

          {/* Business Gallery */}
          {profile.gallery && profile.gallery.length > 0 && (
            <div className="px-6 pb-6 pt-2 border-t border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">Gallery</p>
              <div className="grid grid-cols-3 gap-3">
                {profile.gallery.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/50 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {contactButtons.length > 0 && (
          <Card className="card-artistic">
            <CardContent className={`p-4 grid gap-2 ${contactButtons.length <= 2 ? "grid-cols-2" : contactButtons.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {contactButtons.map((btn) => (
                <a key={btn.label} href={btn.href} target={btn.external ? "_blank" : undefined} rel={btn.external ? "noopener noreferrer" : undefined}>
                  <Button variant="outline" className="w-full flex-col h-auto py-3 gap-1">
                    {btn.icon} <span className="text-xs">{btn.label}</span>
                  </Button>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Menu Section with Ordering */}
        {categories.length > 0 && (
          <Card className="card-artistic">
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
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-black/5 hover:bg-black/10 transition-colors">
                        <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center border border-border">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <span className="text-2xl select-none">🍽️</span>}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="flex-1 min-w-0 cursor-pointer group">
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                                {item.name} <Info className="h-3 w-3 opacity-50" />
                              </h4>
                              {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm rounded-3xl p-6">
                            <DialogHeader><DialogTitle className="text-xl">{item.name}</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border"><img src={item.image_url || "/placeholder-food.png"} className="w-full h-full object-cover" /></div>
                              {item.gallery && item.gallery.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {item.gallery.map((url: string, gi: number) => (
                                    <div key={gi} className="aspect-square rounded-lg overflow-hidden border"><img src={url} className="h-full w-full object-cover" /></div>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground">{item.description || "No description available."}</p>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xl font-bold text-primary">Rs. {Number(item.price).toFixed(2)}</span>
                                <Button className="rounded-full px-6" onClick={() => addToCart(item)}>Add to Order</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <div className="flex items-center gap-3 ml-2">
                          <span className="font-display font-semibold text-primary text-sm shrink-0">Rs. {Number(item.price).toFixed(2)}</span>
                          <div className="flex items-center gap-1 border-l pl-3">
                            {cart[item.id] ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => removeFromCart(item.id)}><MinusCircle className="h-5 w-5 text-primary" /></button>
                                <span className="text-xs font-bold w-4 text-center">{cart[item.id].quantity}</span>
                                <button onClick={() => addToCart(item)}><PlusCircle className="h-5 w-5 text-primary" /></button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => addToCart(item)}><PlusCircle className="h-6 w-6 text-primary" /></Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-6 w-full max-w-lg px-6 flex justify-center">
          <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-14 rounded-full shadow-2xl flex items-center justify-between px-6 bg-primary hover:bg-primary/90 transition-all">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full"><ShoppingBag className="h-5 w-5 text-white" /></div>
                  <div className="text-left text-white">
                    <p className="text-[10px] uppercase font-bold opacity-70">Review Order</p>
                    <p className="text-sm font-bold">{cartItemsCount} Items</p>
                  </div>
                </div>
                <div className="text-right text-white"><p className="text-lg font-bold">Rs. {cartTotal.toFixed(2)}</p></div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogHeader><DialogTitle>Complete Your Order</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Table Number *</Label>
                  <Input placeholder="E.g. Table 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="h-12 text-lg" />
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.values(cart).map((c) => (
                    <div key={c.item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div><p className="text-sm font-medium">{c.item.name}</p><p className="text-xs text-muted-foreground">x{c.quantity}</p></div>
                      <p className="text-sm font-bold">Rs. {(c.item.price * c.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t-2 border-dashed">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary">Rs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl text-lg font-bold" disabled={ordering || !tableNumber} onClick={handlePlaceOrder}>
                  {ordering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Place Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
