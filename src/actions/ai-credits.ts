"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiCredit } from "@/lib/types/database";

const ROLE_CREDITS: Record<string, number> = {
  admin: 999999,
  rh: 100,
  responsable_qse: 100,
  chef_chantier: 50,
  technicien: 30,
};

export async function getMyCredits(): Promise<{
  used: number;
  limit: number;
  remaining: number;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const period = new Date().toISOString().slice(0, 7);
  const creditLimit = ROLE_CREDITS[profile.role] ?? 30;

  let { data: credit } = await supabase
    .from("ai_credits")
    .select("*")
    .eq("user_id", user.id)
    .eq("period", period)
    .single();

  if (!credit) {
    const { data: newCredit } = await supabase
      .from("ai_credits")
      .insert({
        user_id: user.id,
        credits_used: 0,
        credits_limit: creditLimit,
        period,
      })
      .select("*")
      .single();
    credit = newCredit;
  }

  if (!credit) return null;

  return {
    used: credit.credits_used,
    limit: credit.credits_limit,
    remaining: Math.max(0, credit.credits_limit - credit.credits_used),
  };
}

export async function getCreditsForAllUsers(): Promise<
  (AiCredit & { profile?: { first_name: string; last_name: string; role: string } })[]
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return [];
  }

  const period = new Date().toISOString().slice(0, 7);
  const supabaseAdmin = createAdminClient();

  const { data } = await supabaseAdmin
    .from("ai_credits")
    .select("*, profile:profiles(first_name, last_name, role)")
    .eq("period", period)
    .order("credits_used", { ascending: false });

  return (data as unknown as (AiCredit & { profile?: { first_name: string; last_name: string; role: string } })[]) ?? [];
}
