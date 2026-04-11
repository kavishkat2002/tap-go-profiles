import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Palette, Check, LayoutTemplate, Paintbrush } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  { id: "theme-default", name: "Default", color: "hsl(220 20% 97%)" },
  { id: "theme-blue", name: "Blue", color: "#3B82F6" },
  { id: "theme-green", name: "Green", color: "#22C55E" },
  { id: "theme-rose", name: "Rose", color: "#F43F5E" },
  { id: "theme-orange", name: "Orange", color: "#F97316" },
];

const BACKGROUNDS = [
  { id: "bg-theme-default", name: "Solid", preview: "bg-muted" },
  { id: "bg-theme-dots", name: "Dots", preview: "bg-[radial-gradient(#00000030_1px,transparent_1px)]" },
  { id: "bg-theme-grid", name: "Grid", preview: "bg-[linear-gradient(#00000020_1px,transparent_1px),linear-gradient(90deg,#00000020_1px,transparent_1px)]" },
  { id: "bg-theme-cultural", name: "Cultural", preview: "bg-primary/20" },
];

export default function ThemeDrawer({ profile }: { profile: any }) {
  const [open, setOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(profile.theme || "theme-default");
  const [activeBg, setActiveBg] = useState(profile.bg_theme || "bg-theme-default");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handlePreviewTheme = (theme: string) => {
    setActiveTheme(theme);
    // Apply live preview to DOM
    const el = document.getElementById("profile-wrapper");
    if (el) {
      el.className = el.className.replace(/theme-[a-z]+/, "").trim() + " " + theme;
    }
  };

  const handlePreviewBg = (bg: string) => {
    setActiveBg(bg);
    // Apply live preview to DOM
    const el = document.getElementById("profile-wrapper");
    if (el) {
      el.className = el.className.replace(/bg-theme-[a-z]+/, "").trim() + " " + bg;
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateProfile(profile.id, { theme: activeTheme, bg_theme: activeBg });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profile.slug] });
      toast({ title: "Theme Saved!", description: "Your profile's appearance has been updated." });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to save theme", description: err.message, variant: "destructive" });
    }
  });

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="default" className="shadow-lg">
          <Palette className="w-4 h-4 mr-2" /> Theme Customizer
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Customize Appearance</DrawerTitle>
            <DrawerDescription>Pick your colors and backgrounds. They will preview instantly!</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-6">
            
            {/* Color Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-display font-medium text-sm">
                <Paintbrush className="w-4 h-4 text-muted-foreground" /> Accent Color
              </div>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handlePreviewTheme(t.id)}
                    className={`h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center ${
                      activeTheme === t.id ? "border-foreground scale-110 shadow-md" : "border-transparent opacity-80 hover:scale-105"
                    }`}
                    style={{ backgroundColor: t.color === "hsl(220 20% 97%)" ? "#f1f5f9" : t.color }}
                  >
                    {activeTheme === t.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-display font-medium text-sm">
                <LayoutTemplate className="w-4 h-4 text-muted-foreground" /> Background Pattern
              </div>
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handlePreviewBg(bg.id)}
                    className={`flex flex-col items-center gap-1.5 transition-all ${
                      activeBg === bg.id ? "opacity-100" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className={`h-12 w-full rounded-lg border-2 flex items-center justify-center ${bg.preview} bg-[size:8px_8px] ${
                      activeBg === bg.id ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-muted"
                    }`}>
                      {activeBg === bg.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
          <DrawerFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Theme"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
