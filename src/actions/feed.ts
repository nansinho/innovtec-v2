"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFeedPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feed_posts")
    .select(
      "*, author:profiles(first_name, last_name, avatar_url), news:news(id, title, image_url, excerpt)"
    )
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function createFeedPost(
  content: string,
  imageUrl?: string,
  newsId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("feed_posts").insert({
    author_id: user.id,
    content,
    image_url: imageUrl ?? "",
    news_id: newsId ?? null,
  });
}
