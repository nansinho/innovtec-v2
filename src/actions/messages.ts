"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InternalMessage, Conversation } from "@/lib/types/database";

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all messages involving the current user
  const { data: messages } = await supabase
    .from("internal_messages")
    .select(
      "*, from_user:profiles!internal_messages_from_user_id_fkey(id, first_name, last_name, avatar_url), to_user:profiles!internal_messages_to_user_id_fkey(id, first_name, last_name, avatar_url)"
    )
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!messages || messages.length === 0) return [];

  // Group by conversation partner
  const convMap = new Map<string, Conversation>();

  for (const msg of messages as InternalMessage[]) {
    const partnerId =
      msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    const partner =
      msg.from_user_id === user.id ? msg.to_user : msg.from_user;

    if (!convMap.has(partnerId) && partner) {
      convMap.set(partnerId, {
        user: partner,
        lastMessage: msg,
        unreadCount: 0,
      });
    }

    // Count unread messages received
    if (msg.to_user_id === user.id && !msg.is_read) {
      const conv = convMap.get(partnerId);
      if (conv) conv.unreadCount++;
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  );
}

export async function getConversationMessages(
  partnerId: string
): Promise<InternalMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("internal_messages")
    .select(
      "*, from_user:profiles!internal_messages_from_user_id_fkey(id, first_name, last_name, avatar_url), to_user:profiles!internal_messages_to_user_id_fkey(id, first_name, last_name, avatar_url)"
    )
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(100);

  return (data as InternalMessage[]) ?? [];
}

export async function sendMessage(toUserId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  if (!content.trim()) return { success: false, error: "Message vide" };

  const { error } = await supabase.from("internal_messages").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    content: content.trim(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function markConversationAsRead(partnerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("internal_messages")
    .update({ is_read: true })
    .eq("from_user_id", partnerId)
    .eq("to_user_id", user.id)
    .eq("is_read", false);
}

export async function getUnreadMessagesCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("internal_messages")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  await supabase.from("internal_messages").delete().eq("id", messageId);
  revalidatePath("/");
}

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("is_active", true)
    .neq("id", user.id)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);

  return data ?? [];
}
