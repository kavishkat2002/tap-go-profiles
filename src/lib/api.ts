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

  // No categories → no items to fetch
  if (!categories || categories.length === 0) return [];

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categories.map((c) => c.id))
    .order("sort_order");
  if (itemErr) throw itemErr;

  return categories.map((cat) => ({
    ...cat,
    items: (items ?? []).filter((i) => i.category_id === cat.id),
  }));
}


export async function createProfile(profile: TablesInsert<"profiles">) {
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Profile could not be created — check RLS policies.");
  return data[0];
}

export async function createMenuCategory(category: TablesInsert<"menu_categories">) {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert(category)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Category could not be created — check RLS policies.");
  return data[0];
}

export async function createMenuItem(item: TablesInsert<"menu_items">) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Item could not be created — check RLS policies.");
  return data[0];
}

export async function incrementViews(slug: string) {
  await supabase.rpc("increment_profile_views", { profile_slug: slug });
}

export async function updateProfile(id: string, updates: Partial<TablesInsert<"profiles">>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Profile update failed — row not found or RLS blocked.");
  return data[0];
}

export async function updateMenuCategory(id: string, updates: Partial<TablesInsert<"menu_categories">>) {
  const { data, error } = await supabase
    .from("menu_categories")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Category update failed.");
  return data[0];
}

export async function updateMenuItem(id: string, updates: Partial<TablesInsert<"menu_items">>) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Item update failed.");
  return data[0];
}

export async function deleteMenuCategory(id: string) {
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

