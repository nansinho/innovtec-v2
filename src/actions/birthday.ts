"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotificationForUser } from "@/actions/notifications";
import { createFeedPost } from "@/actions/feed";
import type { Profile, BirthdayWish } from "@/lib/types/database";
import { auditLog } from "@/lib/audit-logger";

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

  // Récupérer le nom de l'expéditeur pour la notification
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const senderName = senderProfile
    ? `${senderProfile.first_name} ${senderProfile.last_name}`
    : "Un collègue";

  // Skip notification and feed post for self-replies (birthday person replying)
  if (user.id !== toUserId) {
    await createNotificationForUser({
      user_id: toUserId,
      type: "birthday",
      title: `${senderName} vous souhaite un joyeux anniversaire !`,
      message,
      link: "/social",
    });

    // Publier dans le fil d'actualités
    const { data: recipient } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", toUserId)
      .single();

    const recipientName = recipient
      ? `${recipient.first_name} ${recipient.last_name}`.trim()
      : "un collègue";

    await createFeedPost(
      `a souhaité un joyeux anniversaire à ${recipientName} 🎂`
    );
  }

  await auditLog(user.id, "send_wish", "birthday", toUserId, { year });
  return { success: true };
}

export async function getMyBirthdayWishes(): Promise<BirthdayWish[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getBirthdayWishesForUser(user.id);
}

/** Optimized: skips auth lookup when userId is already known */
export async function getBirthdayWishesForUser(userId: string): Promise<BirthdayWish[]> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data } = await supabase
    .from("birthday_wishes")
    .select("*, from_user:profiles!birthday_wishes_from_user_id_fkey(first_name, last_name, avatar_url)")
    .eq("to_user_id", userId)
    .eq("year", year)
    .order("created_at", { ascending: false });

  return (data as unknown as BirthdayWish[]) ?? [];
}

export async function getBirthdayWishesFor(userId: string): Promise<BirthdayWish[]> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data } = await supabase
    .from("birthday_wishes")
    .select("*, from_user:profiles!birthday_wishes_from_user_id_fkey(first_name, last_name, avatar_url)")
    .eq("to_user_id", userId)
    .eq("year", year)
    .order("created_at", { ascending: true });

  return (data as unknown as BirthdayWish[]) ?? [];
}

export async function updateBirthdayWish(
  wishId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };
  if (!message.trim()) return { success: false, error: "Message vide" };

  const { error } = await supabase
    .from("birthday_wishes")
    .update({ message: message.trim() })
    .eq("id", wishId)
    .eq("from_user_id", user.id);

  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "update", "birthday", wishId, {});
  return { success: true };
}

export async function deleteBirthdayWish(
  wishId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("birthday_wishes")
    .delete()
    .eq("id", wishId)
    .eq("from_user_id", user.id);

  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "delete", "birthday", wishId, {});
  return { success: true };
}

export async function isMyBirthday(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  return isUserBirthday(user.id);
}

/** Optimized: skips auth lookup when userId is already known */
export async function isUserBirthday(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth")
    .eq("id", userId)
    .single();

  if (!profile?.date_of_birth) return false;

  const today = new Date();
  const dob = new Date(profile.date_of_birth);
  return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
}
