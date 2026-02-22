"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUpcomingEvents() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(10);
  return data ?? [];
}
