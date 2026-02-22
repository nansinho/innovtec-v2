"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile, BirthdayWish } from "@/lib/types/database";

export async function getTodayBirthdays(): Promise<Profile[]> {
  const supabase = await createClient();
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Get all active profiles with date_of_birth matching today's month/day
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .not("date_of_birth", "is", null);

  if (!data) return [];

  return data.filter((p) => {
    if (!p.date_of_birth) return false;
    const dob = new Date(p.date_of_birth);
    return dob.getMonth() + 1 === month && dob.getDate() === day;
  });
}

export async function getUpcomingBirthdays(
  days: number = 30
): Promise<Profile[]> {
  const supabase = await createClient();
  const today = new Date();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .not("date_of_birth", "is", null);

  if (!data) return [];

  return data
    .filter((p) => {
      if (!p.date_of_birth) return false;
      const dob = new Date(p.date_of_birth);
      const thisYearBirthday = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate()
      );
      // If already passed, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      const diffDays = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays > 0 && diffDays <= days;
    })
    .sort((a, b) => {
      const dobA = new Date(a.date_of_birth!);
      const dobB = new Date(b.date_of_birth!);
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      const diffA =
        (dobA.getMonth() - todayMonth) * 31 + (dobA.getDate() - todayDay);
      const diffB =
        (dobB.getMonth() - todayMonth) * 31 + (dobB.getDate() - todayDay);
      return (diffA < 0 ? diffA + 365 : diffA) - (diffB < 0 ? diffB + 365 : diffB);
    });
}

export async function sendBirthdayWish(
  toUserId: string,
  message: string = "Joyeux anniversaire !"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const year = new Date().getFullYear();

  const { error } = await supabase.from("birthday_wishes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    message,
    year,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Vous avez déjà envoyé vos vœux" };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getMyBirthdayWishes(): Promise<BirthdayWish[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const year = new Date().getFullYear();

  const { data } = await supabase
    .from("birthday_wishes")
    .select("*, from_user:profiles!birthday_wishes_from_user_id_fkey(first_name, last_name, avatar_url)")
    .eq("to_user_id", user.id)
    .eq("year", year)
    .order("created_at", { ascending: false });

  return (data as unknown as BirthdayWish[]) ?? [];
}

export async function isMyBirthday(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth")
    .eq("id", user.id)
    .single();

  if (!profile?.date_of_birth) return false;

  const today = new Date();
  const dob = new Date(profile.date_of_birth);
  return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
}
