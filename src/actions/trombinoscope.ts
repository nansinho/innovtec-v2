"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getTrombinoscopeUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  return (data as Profile[]) ?? [];
}
