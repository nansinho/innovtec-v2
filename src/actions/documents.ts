"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDocuments(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("*, uploaded_by_profile:profiles(first_name, last_name)")
    .order("created_at", { ascending: false });

  if (category && category !== "general") {
    query = query.eq("category", category);
  }

  const { data } = await query.limit(50);
  return data ?? [];
}
