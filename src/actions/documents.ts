"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit-logger";

export async function getDocuments(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("*, uploaded_by_profile:profiles(first_name, last_name)")
    .order("created_at", { ascending: false });

  if (category && category !== "general") {
    query = query.eq("category", category);
  }

  const { data } = await query.limit(50);
  const docs = data ?? [];

  // Resolve REX links for rex documents
  const rexDocs = docs.filter(
    (d) => d.category === "rex" && d.file_url && !d.file_url.startsWith("/qse/rex/")
  );
  const rexLinks: Record<string, string> = {};
  if (rexDocs.length > 0) {
    const fileUrls = rexDocs.map((d) => d.file_url).filter(Boolean);
    const { data: rexRows } = await supabase
      .from("rex")
      .select("id, source_file_url")
      .in("source_file_url", fileUrls);
    if (rexRows) {
      for (const row of rexRows) {
        rexLinks[row.source_file_url] = `/qse/rex/${row.id}`;
      }
    }
  }

  return docs.map((doc) => {
    let rex_link: string | undefined;
    if (doc.category === "rex") {
      if (doc.file_url?.startsWith("/qse/rex/")) {
        rex_link = doc.file_url;
      } else if (doc.file_url && rexLinks[doc.file_url]) {
        rex_link = rexLinks[doc.file_url];
      }
    }
    return { ...doc, rex_link };
  });
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
  await supabase.from("documents").delete().eq("file_url", fileUrl);
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
