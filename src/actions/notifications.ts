"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Notification } from "@/lib/types/database";

export async function getMyNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as Notification[]) ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  revalidatePath("/", "layout");
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/", "layout");
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", notificationId);
  revalidatePath("/", "layout");
}

export async function createNotificationForAll(data: {
  type: Notification["type"];
  title: string;
  message: string;
  link?: string;
  related_id?: string;
  excludeUserId?: string;
}) {
  const supabaseAdmin = createAdminClient();

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("is_active", true);

  if (!profiles) return;

  const notifications = profiles
    .filter((p) => p.id !== data.excludeUserId)
    .map((p) => ({
      user_id: p.id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link ?? "",
      related_id: data.related_id ?? null,
    }));

  if (notifications.length > 0) {
    await supabaseAdmin.from("notifications").insert(notifications);
  }
}

export async function createNotificationForUser(data: {
  user_id: string;
  type: Notification["type"];
  title: string;
  message: string;
  link?: string;
  related_id?: string;
}) {
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("notifications").insert({
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link ?? "",
    related_id: data.related_id ?? null,
  });
}
