import { supabase } from "@/supabase/client";

export async function isAdmin(user_id: string) {
  const { data } = await supabase
    .from("admin")
    .select("user_id")
    .eq("user_id", user_id)
    .maybeSingle();
  return !!data;
}
