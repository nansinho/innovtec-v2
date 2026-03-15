"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "actualite" | "document" | "collaborateur" | "formation" | "evenement" | "qse" | "danger" | "rex";
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

  // Search QSE content (policies)
  const { data: qseContent } = await supabase
    .from("qse_content")
    .select("id, title, type, year")
    .or(`title.ilike.%${q}%`)
    .limit(5);

  if (qseContent) {
    results.push(
      ...qseContent.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.year ? `${c.type} — ${c.year}` : c.type,
        category: "qse" as const,
        link: `/qse/${c.type}`,
      }))
    );
  }

  // Search danger reports
  const { data: dangers } = await supabase
    .from("danger_reports")
    .select("id, title, description, location, status")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(5);

  if (dangers) {
    results.push(
      ...dangers.map((d) => ({
        id: d.id,
        title: d.title,
        description: `${d.location}${d.status ? ` — ${d.status}` : ""}`,
        category: "danger" as const,
        link: "/qse/dangers",
      }))
    );
  }

  // Search REX
  const { data: rexList } = await supabase
    .from("rex")
    .select("id, title, description, chantier")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,lessons_learned.ilike.%${q}%,chantier.ilike.%${q}%`)
    .limit(5);

  if (rexList) {
    results.push(
      ...rexList.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.chantier || r.description || "",
        category: "rex" as const,
        link: "/qse/rex",
      }))
    );
  }

  return results;
}
