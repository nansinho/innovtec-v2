import { redirect } from "next/navigation";
import { getProfile } from "@/actions/auth";
import NewsEditorPage from "@/components/news/news-editor-page";


export default async function CreateArticlePage() {
  const profile = await getProfile();

  if (
    !profile ||
    !["admin", "rh", "responsable_qse"].includes(profile.role)
  ) {
    redirect("/actualites");
  }

  return <NewsEditorPage mode="create" />;
}
