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
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(profileId: string) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);
  if (error) throw error;
}

export async function createMenuCategory(category: TablesInsert<"menu_categories">) {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMenuItem(item: TablesInsert<"menu_items">) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function incrementViews(slug: string) {
  await supabase.rpc("increment_profile_views", { profile_slug: slug });
}

export async function updateProfile(id: string, updates: Partial<TablesInsert<"profiles">>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuCategory(id: string, updates: Partial<TablesInsert<"menu_categories">>) {
  const { data, error } = await supabase
    .from("menu_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id: string, updates: Partial<TablesInsert<"menu_items">>) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMenuCategory(id: string) {
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function createOrder(order: any) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── admin ───────────────────────────────────────────────────────────────────

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(name, slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchOrdersByProfileId(profileId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ─── profile requests ────────────────────────────────────────────────────────

export async function createProfileRequest(request: TablesInsert<"profile_requests">) {
  const { data, error } = await supabase
    .from("profile_requests")
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserProfileRequests(userId: string) {
  const { data, error } = await supabase
    .from("profile_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllProfileRequests() {
  const { data, error } = await supabase
    .from("profile_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateProfileRequest(id: string, updates: Partial<TablesInsert<"profile_requests">>) {
  const { data, error } = await supabase
    .from("profile_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
