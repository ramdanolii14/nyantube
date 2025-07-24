import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Biar file lain yang import { createClient } tetap jalan:
export const createClient = () => supabase;
