"use server";

import { createClient } from "@/lib/supabase/server";
import type { TimebitMode } from "@/lib/types/database";

export async function getActiveTimebit() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("timebits")
    .select("*")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .single();
  return data;
}

export async function startTimebit(mode: TimebitMode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("timebits").insert({
    user_id: user.id,
    mode,
  });
}

export async function stopTimebit(id: string) {
  const supabase = await createClient();
  const now = new Date();

  const { data: timebit } = await supabase
    .from("timebits")
    .select("started_at")
    .eq("id", id)
    .single();

  if (!timebit) return;

  const started = new Date(timebit.started_at);
  const durationMinutes = Math.round(
    (now.getTime() - started.getTime()) / 60000
  );

  await supabase
    .from("timebits")
    .update({ ended_at: now.toISOString(), duration_minutes: durationMinutes })
    .eq("id", id);
}
