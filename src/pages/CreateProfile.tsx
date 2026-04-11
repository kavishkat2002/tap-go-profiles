import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, ArrowLeft, Plus, Trash2, ImagePlus, X as XIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createProfile, createMenuCategory, createMenuItem } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import MenuPdfUploader, { type ExtractedCategory } from "@/components/MenuPdfUploader";

type MenuItemLocal = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageFile?: File | null;
  imagePreview?: string | null;
};
type MenuCategoryLocal = { id: string; name: string; items: MenuItemLocal[] };

type ProfileType = "personal" | "business" | "restaurant";

export default function CreateProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [profileType, setProfileType] = useState<ProfileType>("personal");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", phone: "", whatsapp: "",
    email: "", website: "", address: "", facebook: "", instagram: "",
    linkedin: "", twitter: "", services: "", theme: "theme-default"
  });
  const [menuCategories, setMenuCategories] = useState<MenuCategoryLocal[]>([]);
  const [profileImage, setProfileImage] = useState<{ file: File; preview: string } | null>(null);
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null);

  const handlePdfExtracted = useCallback((extracted: ExtractedCategory[]) => {
    setMenuCategories((prev) => [...prev, ...extracted]);
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const addCategory = () => setMenuCategories([...menuCategories, { id: crypto.randomUUID(), name: "", items: [] }]);
  const removeCategory = (id: string) => setMenuCategories(menuCategories.filter(c => c.id !== id));
  const updateCategoryName = (id: string, name: string) => setMenuCategories(menuCategories.map(c => c.id === id ? { ...c, name } : c));
  
  const addItemToCategory = (categoryId: string) => setMenuCategories(menuCategories.map(c =>
    c.id === categoryId ? { ...c, items: [...c.items, { id: crypto.randomUUID(), name: "", description: "", price: "", imageFile: null, imagePreview: null }] } : c
  ));
  const removeItemFromCategory = (categoryId: string, itemId: string) => setMenuCategories(menuCategories.map(c =>
    c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
  ));
  const updateItem = (categoryId: string, itemId: string, field: keyof MenuItemLocal, value: string) => setMenuCategories(menuCategories.map(c =>
    c.id === categoryId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : c
  ));
  const updateItemImage = (categoryId: string, itemId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setMenuCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, imageFile: file, imagePreview: preview } : i) }
        : c
    ));
  };
  const clearItemImage = (categoryId: string, itemId: string) => {
    setMenuCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, imageFile: null, imagePreview: null } : i) }
        : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let finalImageUrl: string | null = null;
      let finalCoverUrl: string | null = null;

      if (profileImage) {
        try {
          const ext = profileImage.file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-profile.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from("profile-images").upload(path, profileImage.file);
          if (uploadErr) throw uploadErr;
          if (uploadData) finalImageUrl = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
        } catch (err: any) {
          toast({ title: "Profile photo upload failed", description: err.message, variant: "destructive" });
        }
      }

      if (coverImage) {
        try {
          const ext = coverImage.file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-cover.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from("profile-images").upload(path, coverImage.file);
          if (uploadErr) throw uploadErr;
          if (uploadData) finalCoverUrl = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
        } catch (err: any) {
          toast({ title: "Cover photo upload failed", description: err.message, variant: "destructive" });
        }
      }

      const profileResponse = await createProfile({
        user_id: user.id,
        type: profileType,
        slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
        name: form.name,
        image_url: finalImageUrl,
        cover_url: finalCoverUrl,
        description: form.description || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        website: form.website || null,
        address: form.address || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        linkedin: form.linkedin || null,
        twitter: form.twitter || null,
        services: profileType === "business" && form.services
          ? form.services.split("\n").map((s) => s.trim()).filter(Boolean)
          : null,
        theme: form.theme,
      });

      if (profileType === "restaurant") {
        for (let i = 0; i < menuCategories.length; i++) {
          const cat = menuCategories[i];
          if (!cat.name.trim()) continue;
          const newCat = await createMenuCategory({
            profile_id: profileResponse.id,
            name: cat.name,
            sort_order: i
          });

          for (let j = 0; j < cat.items.length; j++) {
            const item = cat.items[j];
            if (!item.name.trim()) continue;

            // Upload item image to Supabase Storage if provided
            let imageUrl: string | null = null;
            if (item.imageFile) {
              try {
                const ext = item.imageFile.name.split('.').pop();
                const path = `menu-items/${profileResponse.id}/${newCat.id}-${j}.${ext}`;
                const { data: uploadData, error: uploadErr } = await supabase
                  .storage.from("menu-images")
                  .upload(path, item.imageFile, { upsert: true });
                if (uploadErr) {
                  toast({
                    title: "Image not uploaded",
                    description: uploadErr.message,
                    variant: "destructive",
                  });
                } else if (uploadData) {
                  const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(uploadData.path);
                  imageUrl = publicUrl;
                }
              } catch (imgErr: any) {
                toast({
                  title: "Image upload failed",
                  description: imgErr?.message ?? "Unknown error",
                  variant: "destructive",
                });
              }
            }

            await createMenuItem({
              category_id: newCat.id,
              name: item.name,
              description: item.description || null,
              price: parseFloat(item.price) || 0,
              image_url: imageUrl,
              sort_order: j
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      toast({ title: "Profile created!", description: "Your profile is now live." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" />
            SmartTap
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Create Profile</CardTitle>
            <CardDescription>Fill in details to create your digital profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Profile Type</Label>
                <Select value={profileType} onValueChange={(v) => setProfileType(v as ProfileType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Card</SelectItem>
                    <SelectItem value="business">Business Page</SelectItem>
                    <SelectItem value="restaurant">Restaurant Menu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col items-start">
                  <Label>Profile Logo / Photo</Label>
                  <label className="flex flex-col items-center justify-center h-32 w-32 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 cursor-pointer overflow-hidden relative">
                    {profileImage ? (
                      <>
                        <img src={profileImage.preview} alt="Profile" className="h-full w-full object-cover" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setProfileImage(null) }} className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <XIcon className="h-6 w-6" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/60">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-[10px] mt-1 font-medium">Upload</span>
                      </div>
                    )}
                    <input type="file" accept="image/jpeg,image/jpg,image/webp,image/png" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) setProfileImage({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) });
                    }} />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label>Cover Photo</Label>
                  <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 cursor-pointer overflow-hidden relative">
                    {coverImage ? (
                      <>
                        <img src={coverImage.preview} alt="Cover" className="h-full w-full object-cover" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setCoverImage(null) }} className="absolute right-2 top-2 bg-black/50 p-1 text-white hover:bg-black/70 transition-colors rounded-full">
                          <XIcon className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/60">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs mt-1 font-medium">Upload Cover</span>
                      </div>
                    )}
                    <input type="file" accept="image/jpeg,image/jpg,image/webp,image/png" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) setCoverImage({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) });
                    }} />
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={set("name")} placeholder={profileType === "restaurant" ? "Restaurant name" : profileType === "business" ? "Business name" : "Your name"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input id="slug" value={form.slug} onChange={set("slug")} placeholder="my-profile" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profile Theme (Color)</Label>
                  <Select value={form.theme} onValueChange={(val) => setForm((f) => ({ ...f, theme: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theme-default">Default Theme</SelectItem>
                      <SelectItem value="theme-blue">Blue Theme</SelectItem>
                      <SelectItem value="theme-green">Green Theme</SelectItem>
                      <SelectItem value="theme-rose">Rose Theme</SelectItem>
                      <SelectItem value="theme-orange">Orange Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Bio</Label>
                <Textarea id="description" value={form.description} onChange={set("description")} placeholder="Tell people about yourself or your business..." rows={3} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" type="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="+1234567890" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="hello@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" type="url" value={form.website} onChange={set("website")} placeholder="https://example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={set("address")} placeholder="123 Main St, City" />
              </div>

              <div className="border-t pt-5">
                <h3 className="font-display font-semibold mb-3">Social Links</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input id="facebook" value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" value={form.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input id="twitter" value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/..." />
                  </div>
                </div>
              </div>

              {profileType === "business" && (
                <div className="border-t pt-5">
                  <h3 className="font-display font-semibold mb-3">Services</h3>
                  <Textarea value={form.services} onChange={set("services")} placeholder="Enter services, one per line" rows={4} />
                </div>
              )}

              {profileType === "restaurant" && (
                <div className="border-t pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold">Restaurant Menu</h3>
                      <p className="text-sm text-muted-foreground">Add categories and items to your digital menu.</p>
                    </div>
                    <Button type="button" onClick={addCategory} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </div>

                  {/* ── PDF Upload & Extract ── */}
                  <MenuPdfUploader onExtracted={handlePdfExtracted} />

                  <Accordion type="multiple" className="space-y-4">
                    {menuCategories.map((category) => (
                      <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-2 bg-card">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeCategory(category.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Input 
                            value={category.name} 
                            onChange={(e) => updateCategoryName(category.id, e.target.value)} 
                            placeholder="e.g. Starters, Main Course, Drinks..." 
                            className="bg-transparent border-none focus-visible:ring-0 px-0 font-semibold h-10 text-base"
                          />
                          <AccordionTrigger className="w-8 shrink-0 hover:no-underline px-2 py-3" />
                        </div>
                        <AccordionContent className="pt-2 pb-4 space-y-3 px-10">
                          {category.items.map((item) => {
                            const itemImgInputId = `item-img-${item.id}`;
                            return (
                            <div key={item.id} className="grid sm:grid-cols-12 gap-3 items-start border rounded-lg p-3 relative group bg-muted/40 transition-colors hover:bg-muted/60">
                                <Button type="button" variant="ghost" size="icon" className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItemFromCategory(category.id, item.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>

                                {/* Item photo thumbnail */}
                                <div className="sm:col-span-3">
                                  <label
                                    htmlFor={itemImgInputId}
                                    className="relative flex h-[5.5rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background transition-colors hover:border-primary/60 hover:bg-primary/5"
                                  >
                                    {item.imagePreview ? (
                                      <>
                                        <img src={item.imagePreview} alt="preview" className="h-full w-full object-cover rounded-lg" />
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearItemImage(category.id, item.id); }}
                                          className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70 transition-colors"
                                        >
                                          <XIcon className="h-2.5 w-2.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                                        <ImagePlus className="h-5 w-5" />
                                        <span className="text-[10px] font-medium">Add photo</span>
                                      </div>
                                    )}
                                  </label>
                                  <input
                                    id={itemImgInputId}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) updateItemImage(category.id, item.id, file);
                                    }}
                                  />
                                </div>

                                {/* Name + Description */}
                                <div className="sm:col-span-6 space-y-2">
                                  <Input value={item.name} onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)} placeholder="Item Name" className="h-8 font-medium bg-background" />
                                  <Textarea value={item.description} onChange={(e) => updateItem(category.id, item.id, 'description', e.target.value)} placeholder="Description (ingredients, dietary info...)" rows={2} className="text-sm resize-none bg-background" />
                                </div>

                                {/* Price */}
                                <div className="sm:col-span-3 space-y-2">
                                  <Input value={item.price} onChange={(e) => updateItem(category.id, item.id, 'price', e.target.value)} placeholder="Price (Rs.)" type="number" step="0.01" className="h-8 bg-background" />
                                </div>
                            </div>
                          );})}
                          <Button type="button" variant="ghost" size="sm" onClick={() => addItemToCategory(category.id)} className="w-full text-muted-foreground hover:text-foreground mt-2 border border-dashed">
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {menuCategories.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20 mt-4">
                      <p className="text-sm text-muted-foreground">Your menu is currently empty.</p>
                      <Button type="button" variant="link" onClick={addCategory}>Create your first category</Button>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
