"use server";

import { createClient } from "@/lib/supabase/server";

export async function getRecentPhotos(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
