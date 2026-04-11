import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProfileType } from "@/lib/types";

export default function CreateProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileType, setProfileType] = useState<ProfileType>("personal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Profile created!", description: "Your profile is now live." });
    navigate("/dashboard");
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" placeholder={profileType === "restaurant" ? "Restaurant name" : profileType === "business" ? "Business name" : "Your name"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input id="slug" placeholder="my-profile" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Bio</Label>
                <Textarea id="description" placeholder="Tell people about yourself or your business..." rows={3} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" type="tel" placeholder="+1234567890" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="hello@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" type="url" placeholder="https://example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St, City" />
              </div>

              <div className="border-t pt-5">
                <h3 className="font-display font-semibold mb-3">Social Links</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input id="facebook" placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input id="twitter" placeholder="https://x.com/..." />
                  </div>
                </div>
              </div>

              {profileType === "business" && (
                <div className="border-t pt-5">
                  <h3 className="font-display font-semibold mb-3">Services</h3>
                  <Textarea placeholder="Enter services, one per line" rows={4} />
                </div>
              )}

              {profileType === "restaurant" && (
                <div className="border-t pt-5">
                  <h3 className="font-display font-semibold mb-3">Menu</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You can add menu items after creating the profile.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">Create Profile</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
