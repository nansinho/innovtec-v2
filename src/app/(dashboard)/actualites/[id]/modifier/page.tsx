import { redirect, notFound } from "next/navigation";
import { getProfile } from "@/actions/auth";
import { getNewsByIdAdmin, getNewsAttachments } from "@/actions/news";
import NewsEditorPage from "@/components/news/news-editor-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const profile = await getProfile();

  if (
    !profile ||
    !["admin", "rh", "responsable_qse"].includes(profile.role)
  ) {
    redirect("/actualites");
  }

  const [article, attachments] = await Promise.all([
    getNewsByIdAdmin(id),
    getNewsAttachments(id),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <NewsEditorPage
      mode="edit"
      article={article}
      existingAttachments={attachments}
    />
  );
}
