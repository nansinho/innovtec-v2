"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPublishedNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getCarouselNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("is_carousel", true)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(5);
  return data ?? [];
}
