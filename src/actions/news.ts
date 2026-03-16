"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { News, NewsComment, NewsAttachment } from "@/lib/types/database";
import { createNotificationForAll, createNotificationForUser } from "@/actions/notifications";

// ==========================================
// PUBLIC: Read operations
// ==========================================

export async function getPublishedNews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getLatestNews(limit: number = 3) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
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

export async function getNewsByIdAdmin(newsId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("id", newsId)
    .single();
  return data;
}

// ==========================================
// VIEWS
// ==========================================

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

  await supabase
    .from("news_views")
    .upsert(
      { news_id: newsId, user_id: user.id },
      { onConflict: "news_id,user_id" }
    );
}

// ==========================================
// COMMENTS
// ==========================================

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

  // Notify the news author about the comment
  const { data: news } = await supabase
    .from("news")
    .select("author_id, title")
    .eq("id", newsId)
    .single();

  if (news?.author_id && news.author_id !== user.id) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const commenterName = commenter
      ? `${commenter.first_name} ${commenter.last_name}`.trim()
      : "Quelqu'un";

    await createNotificationForUser({
      user_id: news.author_id,
      type: "comment",
      title: "Nouveau commentaire",
      message: `${commenterName} a commenté votre article "${news.title}"`,
      link: `/actualites/${newsId}`,
      related_id: newsId,
    });
  }

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

// ==========================================
// LIKES
// ==========================================

export async function toggleNewsLike(
  newsId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, liked: false, error: "Non authentifié" };

  // Check if already liked
  const { data: existing } = await supabase
    .from("news_likes")
    .select("id")
    .eq("news_id", newsId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Unlike
    await supabase.from("news_likes").delete().eq("id", existing.id);
    revalidatePath(`/actualites/${newsId}`);
    return { success: true, liked: false };
  } else {
    // Like
    const { error } = await supabase.from("news_likes").insert({
      news_id: newsId,
      user_id: user.id,
    });
    if (error) return { success: false, liked: false, error: error.message };
    revalidatePath(`/actualites/${newsId}`);
    return { success: true, liked: true };
  }
}

export async function getNewsLikesCount(newsId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("news_likes")
    .select("*", { count: "exact", head: true })
    .eq("news_id", newsId);
  return count ?? 0;
}

export async function hasUserLikedNews(newsId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("news_likes")
    .select("id")
    .eq("news_id", newsId)
    .eq("user_id", user.id)
    .single();

  return !!data;
}

// ==========================================
// SHARES
// ==========================================

export async function shareNews(
  newsId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Get article info for feed post
  const { data: article } = await supabase
    .from("news")
    .select("title")
    .eq("id", newsId)
    .single();

  if (!article) return { success: false, error: "Article introuvable" };

  // Record share
  const { error } = await supabase.from("news_shares").insert({
    news_id: newsId,
    user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  // Create feed post for the share
  await supabase.from("feed_posts").insert({
    author_id: user.id,
    content: `a partagé l'article : "${article.title}"`,
    image_url: "",
  });

  revalidatePath(`/actualites/${newsId}`);
  revalidatePath("/");

  await createNotificationForAll({
    type: "news",
    title: "Article partagé",
    message: article.title,
    link: `/actualites/${newsId}`,
    related_id: newsId,
    excludeUserId: user.id,
  });

  return { success: true };
}

export async function getNewsSharesCount(newsId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("news_shares")
    .select("*", { count: "exact", head: true })
    .eq("news_id", newsId);
  return count ?? 0;
}

// ==========================================
// ATTACHMENTS
// ==========================================

export async function getNewsAttachments(
  newsId: string
): Promise<NewsAttachment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_attachments")
    .select("*")
    .eq("news_id", newsId)
    .order("created_at", { ascending: true });

  return (data as NewsAttachment[]) ?? [];
}

export async function addNewsAttachment(
  newsId: string,
  attachment: {
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.from("news_attachments").insert({
    news_id: newsId,
    file_name: attachment.file_name,
    file_url: attachment.file_url,
    file_size: attachment.file_size,
    file_type: attachment.file_type,
    uploaded_by: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/actualites/${newsId}`);
  return { success: true };
}

export async function deleteNewsAttachment(
  attachmentId: string,
  newsId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("news_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/actualites/${newsId}`);
  return { success: true };
}

// ==========================================
// NEWS LIST with counts
// ==========================================

export async function getNewsWithViewCounts() {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*, author:profiles(first_name, last_name, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (!news || news.length === 0) return [];

  const newsIds = news.map((n) => n.id);

  // Batch: 4 queries total instead of 4 × N
  const [viewsRes, commentsRes, likesRes, sharesRes] = await Promise.all([
    supabase.from("news_views").select("news_id").in("news_id", newsIds),
    supabase.from("news_comments").select("news_id").in("news_id", newsIds),
    supabase.from("news_likes").select("news_id").in("news_id", newsIds),
    supabase.from("news_shares").select("news_id").in("news_id", newsIds),
  ]);

  // Count occurrences per news_id
  function countByNewsId(rows: Array<{ news_id: string }> | null) {
    const map: Record<string, number> = {};
    for (const r of rows ?? []) {
      map[r.news_id] = (map[r.news_id] ?? 0) + 1;
    }
    return map;
  }

  const viewsMap = countByNewsId(viewsRes.data as Array<{ news_id: string }> | null);
  const commentsMap = countByNewsId(commentsRes.data as Array<{ news_id: string }> | null);
  const likesMap = countByNewsId(likesRes.data as Array<{ news_id: string }> | null);
  const sharesMap = countByNewsId(sharesRes.data as Array<{ news_id: string }> | null);

  return news.map((n) => ({
    ...n,
    views_count: viewsMap[n.id] ?? 0,
    comments_count: commentsMap[n.id] ?? 0,
    likes_count: likesMap[n.id] ?? 0,
    shares_count: sharesMap[n.id] ?? 0,
  }));
}

// ==========================================
// ADMIN: Create & Update
// ==========================================

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

  // Create feed post when published
  if (formData.is_published && data) {
    await supabase.from("feed_posts").insert({
      author_id: user.id,
      content: `a publié un nouvel article : "${formData.title}"`,
      image_url: formData.image_url || "",
      news_id: data.id,
    });

    // Notify all users about new published news
    await createNotificationForAll({
      type: "news",
      title: "Nouvelle actualité",
      message: formData.title,
      link: `/actualites/${data.id}`,
      related_id: data.id,
      excludeUserId: user.id,
    });
  }

  revalidatePath("/actualites");
  revalidatePath("/admin/news");
  revalidatePath("/");
  return { success: true, id: data?.id };
}

export async function updateNews(
  newsId: string,
  formData: {
    title: string;
    excerpt: string;
    content: string;
    category: News["category"];
    priority: News["priority"];
    image_url: string;
    is_carousel: boolean;
    is_published: boolean;
    published_at?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Get current state to check if it was previously unpublished
  const { data: current } = await supabase
    .from("news")
    .select("is_published, published_at")
    .eq("id", newsId)
    .single();

  const updateData: Record<string, unknown> = {
    ...formData,
  };

  // If a specific published_at was provided, use it
  if (formData.published_at !== undefined) {
    updateData.published_at = formData.published_at;
  } else if (formData.is_published && !current?.published_at) {
    // Set published_at if being published for the first time
    updateData.published_at = new Date().toISOString();
  } else if (!formData.is_published) {
    updateData.published_at = null;
  }

  const { error } = await supabase
    .from("news")
    .update(updateData)
    .eq("id", newsId);

  if (error) return { success: false, error: error.message };

  // If just published, create feed post and notifications
  if (formData.is_published && !current?.is_published) {
    await supabase.from("feed_posts").insert({
      author_id: user.id,
      content: `a publié un nouvel article : "${formData.title}"`,
      image_url: formData.image_url || "",
      news_id: newsId,
    });

    // Notify all users about newly published news
    await createNotificationForAll({
      type: "news",
      title: "Nouvelle actualité",
      message: formData.title,
      link: `/actualites/${newsId}`,
      related_id: newsId,
      excludeUserId: user.id,
    });
  }

  revalidatePath("/actualites");
  revalidatePath(`/actualites/${newsId}`);
  revalidatePath("/admin/news");
  revalidatePath("/");
  return { success: true };
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
