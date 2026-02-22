"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { News, NewsComment } from "@/lib/types/database";

export async function getPublishedNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getCarouselNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("is_carousel", true)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export async function getNewsById(newsId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("id", newsId)
    .eq("is_published", true)
    .single();
  return data;
}

export async function getNewsViewsCount(newsId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("news_views")
    .select("*", { count: "exact", head: true })
    .eq("news_id", newsId);
  return count ?? 0;
}

export async function recordNewsView(newsId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert so we count unique views per user
  await supabase
    .from("news_views")
    .upsert(
      { news_id: newsId, user_id: user.id },
      { onConflict: "news_id,user_id" }
    );
}

export async function getNewsComments(newsId: string): Promise<NewsComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_comments")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("news_id", newsId)
    .order("created_at", { ascending: true });

  return (data as unknown as NewsComment[]) ?? [];
}

export async function addNewsComment(
  newsId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  if (!content.trim()) return { success: false, error: "Commentaire vide" };

  const { error } = await supabase.from("news_comments").insert({
    news_id: newsId,
    author_id: user.id,
    content: content.trim(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/actualites/${newsId}`);
  return { success: true };
}

export async function deleteNewsComment(
  commentId: string,
  newsId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("news_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/actualites/${newsId}`);
  return { success: true };
}

export async function getNewsWithViewCounts() {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (!news) return [];

  // Get view counts for all news
  const newsWithViews = await Promise.all(
    news.map(async (n) => {
      const { count } = await supabase
        .from("news_views")
        .select("*", { count: "exact", head: true })
        .eq("news_id", n.id);

      const { count: commentCount } = await supabase
        .from("news_comments")
        .select("*", { count: "exact", head: true })
        .eq("news_id", n.id);

      return { ...n, views_count: count ?? 0, comments_count: commentCount ?? 0 };
    })
  );

  return newsWithViews;
}

// Admin: create a news article
export async function createNews(formData: {
  title: string;
  excerpt: string;
  content: string;
  category: News["category"];
  priority: News["priority"];
  image_url: string;
  is_carousel: boolean;
  is_published: boolean;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data, error } = await supabase
    .from("news")
    .insert({
      ...formData,
      author_id: user.id,
      published_at: formData.is_published ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Notify all users about new published news
  if (formData.is_published && data) {
    const supabaseAdmin = createAdminClient();
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("is_active", true);

    if (profiles) {
      const notifications = profiles
        .filter((p) => p.id !== user.id)
        .map((p) => ({
          user_id: p.id,
          type: "news" as const,
          title: "Nouvelle actualité",
          message: formData.title,
          link: `/actualites/${data.id}`,
          related_id: data.id,
        }));

      if (notifications.length > 0) {
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    }
  }

  revalidatePath("/actualites");
  revalidatePath("/admin/news");
  return { success: true, id: data?.id };
}

// Admin: get all news (including unpublished)
export async function getAllNewsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// Admin: toggle publish
export async function togglePublishNews(
  newsId: string,
  publish: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("news")
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", newsId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/actualites");
  revalidatePath("/admin/news");
  return { success: true };
}

// Admin: delete news
export async function deleteNews(
  newsId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", newsId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/actualites");
  revalidatePath("/admin/news");
  return { success: true };
}
