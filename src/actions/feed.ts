"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFeedPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feed_posts")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function createFeedPost(content: string, imageUrl?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("feed_posts").insert({
    author_id: user.id,
    content,
    image_url: imageUrl ?? "",
  });
}
