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

export async function getTodayEvents() {
  const supabase = await createClient();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", startOfDay)
    .lt("start_at", endOfDay)
    .order("start_at", { ascending: true });
  return data ?? [];
}
