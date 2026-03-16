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

export async function getMonthEvents(year: number, month: number) {
  const supabase = await createClient();
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 1).toISOString();

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", startOfMonth)
    .lt("start_at", endOfMonth)
    .order("start_at", { ascending: true });
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
