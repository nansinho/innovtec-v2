"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit-logger";

export interface UnifiedDocument {
  id: string;
  name: string;
  file_url: string;
  file_size?: number;
  file_type: string;
  category: string;
  created_at: string;
  uploaded_by_profile?: { first_name: string; last_name: string } | null;
  /** For REX items, link directly to the detail page */
  internal_link?: string;
}

/**
 * Get all documents: real uploaded docs + REX fiches (read directly from rex table).
 * This avoids any sync issues since REX data is always read from the source.
 */
export async function getDocuments(category?: string): Promise<UnifiedDocument[]> {
  const supabase = await createClient();

  // 1. Get real uploaded documents (exclude old rex category duplicates)
  const shouldFetchDocs = !category || category === "general" || (category !== "rex");
  const shouldFetchRex = !category || category === "general" || category === "rex";

  const results: UnifiedDocument[] = [];

  if (shouldFetchDocs) {
    let query = supabase
      .from("documents")
      .select("*, uploaded_by_profile:profiles(first_name, last_name)")
      .neq("category", "rex") // Skip old rex duplicates
      .order("created_at", { ascending: false });

    if (category && category !== "general" && category !== "rex") {
      query = query.eq("category", category);
    }

    const { data } = await query.limit(50);
    if (data) {
      results.push(
        ...data.map((d) => ({
          id: d.id,
          name: d.name,
          file_url: d.file_url,
          file_size: d.file_size ?? undefined,
          file_type: d.file_type ?? "pdf",
          category: d.category ?? "general",
          created_at: d.created_at,
          uploaded_by_profile: d.uploaded_by_profile as { first_name: string; last_name: string } | null,
        }))
      );
    }
  }

  // 2. Get REX fiches directly from the source table
  if (shouldFetchRex) {
    const { data: rexList } = await supabase
      .from("rex")
      .select("id, title, rex_number, rex_year, created_at, source_file_url, author:profiles!rex_author_id_fkey(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (rexList) {
      results.push(
        ...rexList.map((r) => {
          const rexNum = r.rex_number || "X";
          const rexYr = r.rex_year || new Date().getFullYear();
          const authorRaw = r.author as unknown;
          const author = Array.isArray(authorRaw) ? authorRaw[0] as { first_name: string; last_name: string } | undefined : authorRaw as { first_name: string; last_name: string } | null;
          return {
            id: `rex-${r.id}`,
            name: `Fiche REX ${rexNum}/${rexYr} - ${r.title}`,
            file_url: r.source_file_url || `/qse/rex/${r.id}`,
            file_type: r.source_file_url ? "pdf" : "rex",
            category: "rex",
            created_at: r.created_at,
            uploaded_by_profile: author,
            internal_link: `/qse/rex/${r.id}`,
          };
        })
      );
    }
  }

  // Sort all results by date descending
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return results;
}

export async function deleteDocument(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Get the document to delete associated storage file
  const { data: doc } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .single();

  // Delete storage file if it exists
  if (doc?.file_url) {
    await supabase.storage.from("documents").remove([doc.file_url]);
  }

  // Delete the document record
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "delete", "document", id, { file_url: doc?.file_url });

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDocumentsByFileUrl(
  fileUrl: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("documents").delete().eq("file_url", fileUrl);

  if (user) {
    await auditLog(user.id, "delete", "document", null, { file_url: fileUrl });
  }

  revalidatePath("/documents");
  revalidatePath("/");
}

export async function batchDeleteDocuments(
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Get files to delete from storage
  const { data: docs } = await supabase
    .from("documents")
    .select("file_url")
    .in("id", ids);

  // Delete storage files
  if (docs && docs.length > 0) {
    const filePaths = docs.map((d) => d.file_url).filter(Boolean);
    if (filePaths.length > 0) {
      await supabase.storage.from("documents").remove(filePaths);
    }
  }

  // Delete document records
  const { error } = await supabase.from("documents").delete().in("id", ids);
  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "batch_delete", "document", null, { ids, count: ids.length });

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: true };
}
