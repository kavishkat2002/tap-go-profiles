import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jstrvehfhskwvnojkzis.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHJ2ZWhmaHNrd3Zub2premlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDU1NzAsImV4cCI6MjA5MTQ4MTU3MH0.z8zEjb0rmDinf77vNVtYR_zTV_KkZIiUms5d0MTBCUo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc("increment_profile_views", { profile_slug: "test-slug" });
  console.log("RPC Error:", error);
}

run();
