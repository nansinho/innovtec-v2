"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FeedComment } from "@/lib/types/database";
import { createNotificationForUser } from "@/actions/notifications";

export interface FeedPostWithMeta {
  id: string;
  author_id: string;
  content: string;
  image_url: string;
  news_id: string | null;
  created_at: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  } | null;
  news: {
    id: string;
    title: string;
    image_url: string;
    excerpt: string;
  } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export async function getFeedPosts(): Promise<FeedPostWithMeta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("feed_posts")
    .select(
      "*, author:profiles(first_name, last_name, avatar_url), news:news(id, title, image_url, excerpt)"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (!posts) return [];

  // Fetch likes and comments counts in parallel
  const postIds = posts.map((p) => p.id);

  const [likesResult, commentsResult, userLikesResult] = await Promise.all([
    supabase
      .from("feed_likes")
      .select("post_id", { count: "exact", head: false })
      .in("post_id", postIds),
    supabase
      .from("feed_comments")
      .select("post_id", { count: "exact", head: false })
      .in("post_id", postIds),
    user
      ? supabase
          .from("feed_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build count maps
  const likesMap: Record<string, number> = {};
  const commentsMap: Record<string, number> = {};
  const userLikedSet = new Set<string>();

  (likesResult.data ?? []).forEach((l) => {
    likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1;
  });
  (commentsResult.data ?? []).forEach((c) => {
    commentsMap[c.post_id] = (commentsMap[c.post_id] ?? 0) + 1;
  });
  ((userLikesResult as { data: { post_id: string }[] | null }).data ?? []).forEach((l) => {
    userLikedSet.add(l.post_id);
  });

  return posts.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    content: post.content,
    image_url: post.image_url,
    news_id: post.news_id,
    created_at: post.created_at,
    author: post.author as FeedPostWithMeta["author"],
    news: post.news as FeedPostWithMeta["news"],
    likes_count: likesMap[post.id] ?? 0,
    comments_count: commentsMap[post.id] ?? 0,
    user_has_liked: userLikedSet.has(post.id),
  }));
}

export async function createFeedPost(
  content: string,
  imageUrl?: string,
  newsId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.from("feed_posts").insert({
    author_id: user.id,
    content,
    image_url: imageUrl ?? "",
    news_id: newsId ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/social");
  return { success: true };
}

// ==========================================
// LIKES
// ==========================================

export async function toggleFeedLike(
  postId: string
): Promise<{ liked: boolean; count: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, count: 0 };

  // Check if already liked
  const { data: existing } = await supabase
    .from("feed_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("feed_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("feed_likes").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  // Get new count
  const { count } = await supabase
    .from("feed_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return { liked: !existing, count: count ?? 0 };
}

// ==========================================
// COMMENTS
// ==========================================

export async function getFeedComments(postId: string): Promise<FeedComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feed_comments")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data as unknown as FeedComment[]) ?? [];
}

export async function addFeedComment(
  postId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };
  if (!content.trim()) return { success: false, error: "Commentaire vide" };

  const { error } = await supabase.from("feed_comments").insert({
    post_id: postId,
    author_id: user.id,
    content: content.trim(),
  });

  if (error) return { success: false, error: error.message };

  // Notify the post author
  const { data: post } = await supabase
    .from("feed_posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (post?.author_id && post.author_id !== user.id) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const name = commenter
      ? `${commenter.first_name} ${commenter.last_name}`.trim()
      : "Quelqu'un";

    await createNotificationForUser({
      user_id: post.author_id,
      type: "comment",
      title: "Nouveau commentaire",
      message: `${name} a commenté votre publication`,
      link: "/social",
      related_id: postId,
    });
  }

  return { success: true };
}

export async function deleteFeedComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
