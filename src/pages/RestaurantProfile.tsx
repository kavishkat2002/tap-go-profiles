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
import SuspendedView from "@/components/SuspendedView";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfileFooter from "@/components/ProfileFooter";
import { supabase } from "@/integrations/supabase/client";

export default function RestaurantProfile() {
  const { restaurant } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", restaurant],
    queryFn: () => fetchProfileBySlug(restaurant!),
    enabled: !!restaurant,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["menu", profile?.id],
    queryFn: () => fetchMenuForProfile(profile!.id),
    enabled: !!profile,
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
          // If the blocked status changed, refetch the profile
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

  if ((profile as any).is_blocked) {
    return <SuspendedView />;
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
    profile.phone    && { href: `tel:${profile.phone}`,                              icon: <Phone className="h-5 w-5 text-primary" />,       label: "Call" },
    profile.whatsapp && { href: `https://wa.me/${profile.whatsapp.replace(/\+/g,"")}`, icon: <MessageCircle className="h-5 w-5 text-primary" />, label: "WhatsApp", external: true },
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
      className={`min-h-screen w-full overflow-x-hidden px-3 sm:px-4 pb-28 pt-5 sm:pt-8 flex flex-col items-center ${profile.bg_theme || ''} ${profile.theme || ''}`}
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

        {/* ── Hero card ── */}
        <Card className="card-artistic overflow-hidden">
          {/* Cover */}
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="h-28 sm:h-36 w-full object-cover" />
          ) : (
            <div className="hero-gradient h-28 sm:h-36" />
          )}

          <CardContent className="relative -mt-10 sm:-mt-12 px-4 sm:px-6 pb-5 sm:pb-6">
            {/* Avatar */}
            {profile.image_url ? (
              <img
                src={profile.image_url}
                alt={profile.name}
                className="h-18 w-18 sm:h-20 sm:w-20 rounded-xl object-cover border-4 border-card mb-3 shadow"
                style={{ height: 72, width: 72 }}
              />
            ) : (
              <div className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center mb-3">
                <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
            )}

            <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-1.5 leading-tight">
              {profile.name} <VerifiedBadge />
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
                      {s.icon} <span>{s.label}</span>
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </CardContent>

          {/* Gallery */}
          {profile.gallery && profile.gallery.length > 0 && (
            <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Gallery</p>
              <div className="grid grid-cols-3 gap-2">
                {profile.gallery.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border/40 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ── Contact buttons ── */}
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
                  <Button variant="outline" className="w-full flex-col h-auto py-2.5 sm:py-3 gap-1 text-xs">
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
            <Card className="card-artistic border-0 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform">
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

        {/* ── Menu ── */}
        {categories.length > 0 && (
          <Card className="card-artistic">
            <CardContent className="p-3 sm:p-5">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Menu</h2>
              <Tabs defaultValue={categories[0]?.id}>
                {/* Horizontal scrollable tab bar on mobile */}
                <div className="overflow-x-auto pb-1 -mx-1 px-1 mb-3 sm:mb-4">
                  <TabsList className="flex w-max gap-1 h-auto bg-transparent p-0">
                    {categories.map((cat) => (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {categories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-2.5 mt-0">
                    {(cat as any).items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center border border-border">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            : <span className="text-xl select-none">🍽️</span>
                          }
                        </div>

                        {/* Name & description — tap to open details */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="flex-1 min-w-0 cursor-pointer group">
                              <h4 className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors flex items-center gap-1 leading-snug">
                                {item.name}
                                <Info className="h-3 w-3 opacity-40 shrink-0" />
                              </h4>
                              {item.description && (
                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate leading-snug">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-primary mt-1">Rs. {Number(item.price).toFixed(2)}</p>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-3xl p-5 sm:p-6">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">{item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border">
                                <img src={item.image_url || "/placeholder-food.png"} className="w-full h-full object-cover" alt={item.name} />
                              </div>
                              {item.gallery && item.gallery.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {item.gallery.map((url: string, gi: number) => (
                                    <div key={gi} className="aspect-square rounded-lg overflow-hidden border">
                                      <img src={url} className="h-full w-full object-cover" alt="" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {item.description || "No description available."}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-lg sm:text-xl font-bold text-primary">Rs. {Number(item.price).toFixed(2)}</span>
                                <Button className="rounded-full px-5 text-sm" onClick={() => addToCart(item)}>
                                  Add to Order
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* +/- controls */}
                        <div className="flex items-center gap-1 border-l pl-2.5 sm:pl-3 shrink-0">
                          {cart[item.id] ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="touch-action-manipulation"
                                aria-label="Remove"
                              >
                                <MinusCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{cart[item.id].quantity}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="touch-action-manipulation"
                                aria-label="Add"
                              >
                                <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="touch-action-manipulation p-0.5"
                              aria-label="Add to cart"
                            >
                              <PlusCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                            </button>
                          )}
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

      <ProfileFooter />

      {/* ── Floating Cart ── */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-3 sm:px-4 flex justify-center z-50 pointer-events-none">
          <div className="w-full max-w-md sm:max-w-lg pointer-events-auto">
            <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-14 rounded-full shadow-2xl flex items-center justify-between px-4 sm:px-6 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/20 p-1.5 sm:p-2 rounded-full">
                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="text-left text-white">
                      <p className="text-[10px] uppercase font-bold opacity-70 leading-none">Review Order</p>
                      <p className="text-sm font-bold leading-tight">{cartItemsCount} Item{cartItemsCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white">Rs. {cartTotal.toFixed(2)}</p>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-3xl mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Complete Your Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Table Number *</Label>
                    <Input
                      placeholder="E.g. Table 5"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {Object.values(cart).map((c) => (
                      <div key={c.item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{c.item.name}</p>
                          <p className="text-xs text-muted-foreground">× {c.quantity}</p>
                        </div>
                        <p className="text-sm font-bold">Rs. {(c.item.price * c.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-dashed">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">Rs. {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="w-full h-11 rounded-xl font-bold"
                    disabled={ordering || !tableNumber}
                    onClick={handlePlaceOrder}
                  >
                    {ordering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Place Order"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}
