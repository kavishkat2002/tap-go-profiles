import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, ArrowLeft, Plus, Trash2, Loader2, ImagePlus, X as XIcon, Save, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchProfileBySlug, fetchMenuForProfile,
  updateProfile, updateMenuCategory, updateMenuItem,
  createMenuCategory, createMenuItem,
  deleteMenuCategory, deleteMenuItem,
} from "@/lib/api";
import MenuPdfUploader, { type ExtractedCategory } from "@/components/MenuPdfUploader";
import { supabase } from "@/integrations/supabase/client";

// ─── local types ─────────────────────────────────────────────────────────────

type MenuItemLocal = {
  id: string;           // real DB id OR temp uuid
  name: string;
  description: string;
  price: string;
  imageFile?: File | null;
  imagePreview?: string | null;
  isNew?: boolean;      // created locally, not yet in DB
  deleted?: boolean;    // mark for deletion on save
};
type MenuCategoryLocal = {
  id: string;
  name: string;
  items: MenuItemLocal[];
  isNew?: boolean;
  deleted?: boolean;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function routePrefix(type: string) {
  if (type === "restaurant") return "/r/";
  if (type === "business") return "/b/";
  return "/u/";
}

// ─── component ───────────────────────────────────────────────────────────────

export default function EditProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", slug],
    queryFn: () => fetchProfileBySlug(slug!),
    enabled: !!slug,
  });

  const { data: rawCategories = [] } = useQuery({
    queryKey: ["menu", profile?.id],
    queryFn: () => fetchMenuForProfile(profile!.id),
    enabled: !!profile && profile.type === "restaurant",
  });

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", phone: "", whatsapp: "",
    email: "", website: "", address: "", facebook: "",
    instagram: "", linkedin: "", twitter: "", services: "",
    google_review_url: "",
    workplace: "", position: "", experience: "", projects: "", education: "",
    theme: "theme-default", bg_theme: "bg-theme-default",
  });
  const [galleryImages, setGalleryImages] = useState<{ file: File | null; preview: string | null; id: number }[]>([
    { file: null, preview: null, id: 1 },
    { file: null, preview: null, id: 2 },
    { file: null, preview: null, id: 3 },
  ]);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryLocal[]>([]);
  const [profileImage, setProfileImage] = useState<{ file: File | null; preview: string | null; deleted?: boolean }>({ file: null, preview: null });
  const [coverImage, setCoverImage] = useState<{ file: File | null; preview: string | null; deleted?: boolean }>({ file: null, preview: null });

  // Pre-fill form once profile loads
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      description: profile.description ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      email: profile.email ?? "",
      website: profile.website ?? "",
      address: profile.address ?? "",
      facebook: profile.facebook ?? "",
      instagram: profile.instagram ?? "",
      linkedin: profile.linkedin ?? "",
      twitter: profile.twitter ?? "",
      services: (profile.services ?? []).join("\n"),
      google_review_url: (profile as any).google_review_url ?? "",
      workplace: (profile as any).workplace ?? "",
      position: (profile as any).position ?? "",
      experience: (profile as any).experience ?? "",
      projects: (profile as any).projects ?? "",
      education: (profile as any).education ?? "",
      theme: profile.theme ?? "theme-default",
      bg_theme: profile.bg_theme ?? "bg-theme-default",
    });

    const existingGallery = (profile as any).gallery ?? [];
    setGalleryImages([
      { file: null, preview: existingGallery[0] ?? null, id: 1 },
      { file: null, preview: existingGallery[1] ?? null, id: 2 },
      { file: null, preview: existingGallery[2] ?? null, id: 3 },
    ]);
    setProfileImage({ file: null, preview: profile.image_url ?? null, deleted: false });
    setCoverImage({ file: null, preview: profile.cover_url ?? null, deleted: false });
  }, [profile]);

  // Pre-fill menu once categories load
  useEffect(() => {
    if (!rawCategories.length) return;
    setMenuCategories(
      rawCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        items: (cat.items ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          price: String(item.price ?? ""),
          imagePreview: item.image_url ?? null,
          imageFile: null,
        })),
      }))
    );
  }, [rawCategories]);

  // Guard: not the owner
  const isOwner = !!user && !!profile && profile.user_id === user.id;
  const isBlocked = (profile as any)?.is_blocked === true;

  if (profile && !profileLoading && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8">
            <XIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Access Unauthorized</h1>
            <p className="text-muted-foreground mb-6">You don't have permission to edit this profile.</p>
            <Button asChild className="w-full"><Link to="/dashboard">Back to Dashboard</Link></Button>
        </Card>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 border-destructive/20 bg-destructive/5 backdrop-blur-sm">
            <Ban className="h-12 w-12 text-destructive mx-auto mb-4 animate-pulse" />
            <h1 className="text-xl font-bold mb-2">Editor Locked</h1>
            <p className="text-muted-foreground mb-6">This account is currently suspended. You cannot make any changes until the suspension is lifted.</p>
            <Button asChild variant="outline" className="w-full"><Link to="/dashboard">Return to Dashboard</Link></Button>
        </Card>
      </div>
    );
  }

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── menu helpers ──
  const addCategory = () =>
    setMenuCategories((p) => [...p, { id: crypto.randomUUID(), name: "", items: [], isNew: true }]);

  const removeCategory = (id: string) =>
    setMenuCategories((p) => p.map((c) => c.id === id ? { ...c, deleted: true } : c));

  const updateCategoryName = (id: string, name: string) =>
    setMenuCategories((p) => p.map((c) => c.id === id ? { ...c, name } : c));

  const addItem = (catId: string) =>
    setMenuCategories((p) => p.map((c) =>
      c.id === catId
        ? { ...c, items: [...c.items, { id: crypto.randomUUID(), name: "", description: "", price: "", isNew: true }] }
        : c
    ));

  const removeItem = (catId: string, itemId: string) =>
    setMenuCategories((p) => p.map((c) =>
      c.id === catId
        ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, deleted: true } : i) }
        : c
    ));

  const updateItemField = (catId: string, itemId: string, field: keyof MenuItemLocal, value: string) =>
    setMenuCategories((p) => p.map((c) =>
      c.id === catId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i) } : c
    ));

  const updateItemImage = (catId: string, itemId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setMenuCategories((p) => p.map((c) =>
      c.id === catId
        ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, imageFile: file, imagePreview: preview } : i) }
        : c
    ));
  };

  const clearItemImage = (catId: string, itemId: string) =>
    setMenuCategories((p) => p.map((c) =>
      c.id === catId
        ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, imageFile: null, imagePreview: null } : i) }
        : c
    ));

  const handlePdfExtracted = useCallback((extracted: ExtractedCategory[]) => {
    setMenuCategories((p) => [...p, ...extracted.map((e) => ({ ...e, isNew: true }))]);
  }, []);

  // ── upload image helper ──
  async function uploadItemImage(profileId: string, catId: string, sortOrder: number, file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `menu-items/${profileId}/${catId}-${sortOrder}.${ext}`;
    const { data, error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (error) {
      toast({
        title: "Image not uploaded",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
    if (!data) return null;
    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(data.path);
    return publicUrl;
  }


  // ── save ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !isOwner) return;
    setSaving(true);
    try {
      let finalImageUrl: string | null | undefined = undefined;
      let finalCoverUrl: string | null | undefined = undefined;

      if (profileImage.deleted) {
        finalImageUrl = null;
      } else if (profileImage.file) {
        try {
          const ext = profileImage.file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-profile.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from("profile-images").upload(path, profileImage.file, { upsert: true });
          if (uploadErr) throw uploadErr;
          if (uploadData) finalImageUrl = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
        } catch (err: any) {
          toast({ title: "Profile photo upload failed", description: err.message, variant: "destructive" });
        }
      }

      if (coverImage.deleted) {
         finalCoverUrl = null;
      } else if (coverImage.file) {
        try {
          const ext = coverImage.file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-cover.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from("profile-images").upload(path, coverImage.file, { upsert: true });
          if (uploadErr) throw uploadErr;
          if (uploadData) finalCoverUrl = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
        } catch (err: any) {
          toast({ title: "Cover photo upload failed", description: err.message, variant: "destructive" });
        }
      }

      // Gallery upload
      const finalGallery: (string | null)[] = [...(profile as any).gallery ?? [null, null, null]];
      for (let i = 0; i < 3; i++) {
        const img = galleryImages[i];
        if (img.file) {
          try {
            const ext = img.file.name.split('.').pop();
            const path = `${user.id}/${Date.now()}-gallery-${i}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage.from("profile-images").upload(path, img.file, { upsert: true });
            if (uploadErr) throw uploadErr;
            if (uploadData) finalGallery[i] = supabase.storage.from("profile-images").getPublicUrl(uploadData.path).data.publicUrl;
          } catch (err: any) {
            toast({ title: `Gallery info ${i+1} upload failed`, description: err.message, variant: "destructive" });
          }
        }
      }

      // 1 — update profile fields
      const updates: any = {
        name: form.name,
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
        google_review_url: form.google_review_url || null,
        workplace: form.workplace || null,
        position: form.position || null,
        experience: form.experience || null,
        projects: form.projects || null,
        education: form.education || null,
        gallery: finalGallery,
        theme: form.theme || "theme-default",
        bg_theme: form.bg_theme || "bg-theme-default",
        services: profile.type === "business" && form.services
          ? form.services.split("\n").map((s) => s.trim()).filter(Boolean)
          : profile.services,
      };

      if (finalImageUrl !== undefined) updates.image_url = finalImageUrl;
      if (finalCoverUrl !== undefined) updates.cover_url = finalCoverUrl;

      await updateProfile(profile.id, updates);

      // 2 — restaurant menu sync
      if (profile.type === "restaurant") {
        for (let ci = 0; ci < menuCategories.length; ci++) {
          const cat = menuCategories[ci];

          if (cat.deleted && !cat.isNew) {
            await deleteMenuCategory(cat.id);
            continue;
          }
          if (cat.deleted) continue;
          if (!cat.name.trim()) continue;

          let dbCatId = cat.id;

          if (cat.isNew) {
            const created = await createMenuCategory({ profile_id: profile.id, name: cat.name, sort_order: ci });
            dbCatId = created.id;
          } else {
            await updateMenuCategory(cat.id, { name: cat.name, sort_order: ci });
          }

          const visibleItems = cat.items.filter((i) => !i.deleted || !i.isNew);
          for (let ii = 0; ii < visibleItems.length; ii++) {
            const item = visibleItems[ii];

            if (item.deleted && !item.isNew) {
              await deleteMenuItem(item.id);
              continue;
            }
            if (item.deleted || !item.name.trim()) continue;

            // Upload new image if any
            let imageUrl: string | null | undefined = undefined;
            if (item.imageFile) {
              imageUrl = await uploadItemImage(profile.id, dbCatId, ii, item.imageFile);
            }

            const payload = {
              category_id: dbCatId,
              name: item.name,
              description: item.description || null,
              price: parseFloat(item.price) || 0,
              sort_order: ii,
              ...(imageUrl !== undefined && { image_url: imageUrl }),
            };

            if (item.isNew) {
              await createMenuItem(payload);
            } else {
              await updateMenuItem(item.id, payload);
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["profile", slug] });
      queryClient.invalidateQueries({ queryKey: ["menu", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      toast({ title: "Profile updated!", description: "Your changes are now live." });
      navigate(`${routePrefix(profile.type)}${profile.slug}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── loading / guard states ──
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">You don't have permission to edit this profile.</p>
      </div>
    );
  }

  const profileRoute = `${routePrefix(profile.type)}${profile.slug}`;
  const visibleCategories = menuCategories.filter((c) => !c.deleted);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={profileRoute}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Smartphone className="h-6 w-6 text-primary" />
            SmartTap
          </Link>
          <span className="ml-auto text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">
            {profile.type} profile
          </span>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Edit Profile</CardTitle>
            <CardDescription>Update your details — changes are reflected immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Core fields ── */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col items-start">
                  <Label>Profile Logo / Photo</Label>
                  <label className="flex flex-col items-center justify-center h-32 w-32 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 cursor-pointer overflow-hidden relative">
                    {profileImage.preview && !profileImage.deleted ? (
                      <>
                        <img src={profileImage.preview} alt="Profile" className="h-full w-full object-cover" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setProfileImage({ file: null, preview: null, deleted: true }) }} className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
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
                      if (e.target.files?.[0]) setProfileImage({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]), deleted: false });
                    }} />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label>Cover Photo</Label>
                  <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 cursor-pointer overflow-hidden relative">
                    {coverImage.preview && !coverImage.deleted ? (
                      <>
                        <img src={coverImage.preview} alt="Cover" className="h-full w-full object-cover" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setCoverImage({ file: null, preview: null, deleted: true }) }} className="absolute right-2 top-2 bg-black/50 p-1 text-white hover:bg-black/70 transition-colors rounded-full">
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
                      if (e.target.files?.[0]) setCoverImage({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]), deleted: false });
                    }} />
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={set("name")} required />
                </div>
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
                <Label>URL Slug</Label>
                <Input value={profile.slug} disabled className="opacity-60 cursor-not-allowed" title="Slug cannot be changed" />
              </div>

              <div className="space-y-2">
                <Label>Background Theme (Pattern)</Label>
                <Select value={form.bg_theme} onValueChange={(val) => setForm((f) => ({ ...f, bg_theme: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Background Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-theme-default">Solid (Default)</SelectItem>
                    <SelectItem value="bg-theme-dots">Modern Dots</SelectItem>
                    <SelectItem value="bg-theme-grid">Technical Grid</SelectItem>
                    <SelectItem value="bg-theme-cultural">Cultural (Dancer)</SelectItem>
                    <SelectItem value="bg-theme-white-pattern">White Pattern</SelectItem>
                    <SelectItem value="bg-theme-artistic-abstract">Artistic Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Bio</Label>
                <Textarea id="description" value={form.description} onChange={set("description")} rows={3} />
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
                  <Input id="email" type="email" value={form.email} onChange={set("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" type="url" value={form.website} onChange={set("website")} placeholder="https://example.com" />
                </div>
              </div>

              {profile.type === "personal" && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/50">Career & Showcase</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workplace">Company / Workplace</Label>
                        <Input id="workplace" value={form.workplace} onChange={set("workplace")} placeholder="e.g. CreativeX Tech" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Title / Position</Label>
                        <Input id="position" value={form.position} onChange={set("position")} placeholder="e.g. Senior Developer" className="rounded-xl h-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Professional Experience</Label>
                      <Textarea id="experience" value={form.experience} onChange={set("experience")} placeholder="Describe your career journey..." className="rounded-xl min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Academic Background</Label>
                      <Textarea id="education" value={form.education} onChange={set("education")} placeholder="e.g. B.Sc in Computer Science, Harvard University..." className="rounded-xl min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projects">Projects & Works</Label>
                      <Textarea id="projects" value={form.projects} onChange={set("projects")} placeholder="Showcase your best projects..." className="rounded-xl min-h-[100px]" />
                    </div>

                    <div className="space-y-4">
                        <Label>Works Gallery (3 Photos)</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {galleryImages.map((img, idx) => (
                                <div key={img.id} className="relative group aspect-square rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
                                    {img.preview ? (
                                        <>
                                            <img src={img.preview} alt="Gallery" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newG = [...galleryImages];
                                                    newG[idx] = { ...newG[idx], file: null, preview: null };
                                                    setGalleryImages(newG);
                                                }}
                                                className="absolute top-1 right-1 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer p-4 text-center flex flex-col items-center gap-1">
                                            <ImagePlus className="h-6 w-6 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground font-medium">Upload</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const newG = [...galleryImages];
                                                        newG[idx] = { ...newG[idx], file, preview: URL.createObjectURL(file) };
                                                        setGalleryImages(newG);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={set("address")} />
              </div>

              {/* ── Social links ── */}
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

              {/* ── Google Reviews (business & restaurant only) ── */}
              {(profile.type === "business" || profile.type === "restaurant") && (
                <div className="border-t pt-5">
                  <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Reviews Link
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Paste your Google Business review URL so customers can leave reviews directly.</p>
                  <Input
                    id="google_review_url"
                    value={form.google_review_url}
                    onChange={set("google_review_url")}
                    placeholder="https://g.page/r/YOUR_PLACE_ID/review"
                    type="url"
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    💡 Find it in Google Maps → Your Business → Get more reviews → Share review form
                  </p>
                </div>
              )}

              {/* ── Business: services ── */}
              {profile.type === "business" && (
                <div className="border-t pt-5">
                  <h3 className="font-display font-semibold mb-3">Services</h3>
                  <Textarea value={form.services} onChange={set("services")} placeholder="Enter services, one per line" rows={4} />
                </div>
              )}

              {/* ── Restaurant: menu builder ── */}
              {profile.type === "restaurant" && (
                <div className="border-t pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold">Restaurant Menu</h3>
                      <p className="text-sm text-muted-foreground">Add, edit or remove categories and items.</p>
                    </div>
                    <Button type="button" onClick={addCategory} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </div>

                  {/* PDF / Image import */}
                  <MenuPdfUploader onExtracted={handlePdfExtracted} />

                  <Accordion type="multiple" className="space-y-4">
                    {visibleCategories.map((category) => (
                      <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-2 bg-card">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive shrink-0"
                            onClick={() => removeCategory(category.id)}
                          >
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
                          {category.items.filter((i) => !i.deleted).map((item, ii) => {
                            const imgId = `edit-item-img-${item.id}`;
                            return (
                              <div key={item.id} className="grid sm:grid-cols-12 gap-3 items-start border rounded-lg p-3 relative group bg-muted/40 hover:bg-muted/60 transition-colors">
                                <Button
                                  type="button" variant="ghost" size="icon"
                                  className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeItem(category.id, item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>

                                {/* Image upload */}
                                <div className="sm:col-span-3">
                                  <label
                                    htmlFor={imgId}
                                    className="relative flex h-[5.5rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background hover:border-primary/60 hover:bg-primary/5 transition-colors"
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
                                    id={imgId} type="file" accept="image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) updateItemImage(category.id, item.id, f); }}
                                  />
                                </div>

                                {/* Name + Description */}
                                <div className="sm:col-span-6 space-y-2">
                                  <Input value={item.name} onChange={(e) => updateItemField(category.id, item.id, "name", e.target.value)} placeholder="Item Name" className="h-8 font-medium bg-background" />
                                  <Textarea value={item.description} onChange={(e) => updateItemField(category.id, item.id, "description", e.target.value)} placeholder="Description (ingredients, dietary info...)" rows={2} className="text-sm resize-none bg-background" />
                                </div>

                                {/* Price */}
                                <div className="sm:col-span-3 space-y-2">
                                  <Input value={item.price} onChange={(e) => updateItemField(category.id, item.id, "price", e.target.value)} placeholder="Price (Rs.)" type="number" step="0.01" className="h-8 bg-background" />
                                </div>
                              </div>
                            );
                          })}
                          <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => addItem(category.id)}
                            className="w-full text-muted-foreground hover:text-foreground mt-2 border border-dashed"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {visibleCategories.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20 mt-4">
                      <p className="text-sm text-muted-foreground">No menu categories yet.</p>
                      <Button type="button" variant="link" onClick={addCategory}>Add your first category</Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Submit ── */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link to={profileRoute}>Cancel</Link>
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
