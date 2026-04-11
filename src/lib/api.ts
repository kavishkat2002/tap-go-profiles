import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type MenuCategory = Tables<"menu_categories">;
export type MenuItem = Tables<"menu_items">;

export async function fetchUserProfiles(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchProfileBySlug(slug: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMenuForProfile(profileId: string) {
  const { data: categories, error: catErr } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order");
  if (catErr) throw catErr;

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categories.map((c) => c.id))
    .order("sort_order");
  if (itemErr) throw itemErr;

  return categories.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category_id === cat.id),
  }));
}

export async function createProfile(profile: TablesInsert<"profiles">) {
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementViews(slug: string) {
  await supabase.rpc("increment_profile_views", { profile_slug: slug });
}
