"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "actualite" | "document" | "collaborateur" | "formation" | "evenement";
  link: string;
  image_url?: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Search news
  const { data: news } = await supabase
    .from("news")
    .select("id, title, excerpt, image_url, category")
    .eq("is_published", true)
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(5);

  if (news) {
    results.push(
      ...news.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.excerpt || "",
        category: "actualite" as const,
        link: `/actualites/${n.id}`,
        image_url: n.image_url,
      }))
    );
  }

  // Search documents
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name, category, file_type")
    .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(5);

  if (docs) {
    results.push(
      ...docs.map((d) => ({
        id: d.id,
        title: d.name,
        description: `${d.category} - ${d.file_type}`,
        category: "document" as const,
        link: "/documents",
      }))
    );
  }

  // Search collaborateurs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, job_title, avatar_url")
    .eq("is_active", true)
    .or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,job_title.ilike.%${q}%,email.ilike.%${q}%`
    )
    .limit(5);

  if (profiles) {
    results.push(
      ...profiles.map((p) => ({
        id: p.id,
        title: `${p.first_name} ${p.last_name}`,
        description: p.job_title || "",
        category: "collaborateur" as const,
        link: "/equipe/trombinoscope",
        image_url: p.avatar_url,
      }))
    );
  }

  // Search formations
  const { data: formations } = await supabase
    .from("formations")
    .select("id, title, organisme, description")
    .or(`title.ilike.%${q}%,organisme.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(5);

  if (formations) {
    results.push(
      ...formations.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.organisme || "",
        category: "formation" as const,
        link: "/formations",
      }))
    );
  }

  // Search events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(5);

  if (events) {
    results.push(
      ...events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || "",
        category: "evenement" as const,
        link: "/equipe/planning",
      }))
    );
  }

  return results;
}
