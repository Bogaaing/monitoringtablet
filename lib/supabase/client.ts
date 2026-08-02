import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qxvnjbvhrdsfeebrocrm.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_VZ1EizLLJWwehWerw68ZtQ_R8msK-HO";

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
