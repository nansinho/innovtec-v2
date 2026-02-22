import { getProfile } from "@/actions/auth";
import { getAllNewsAdmin } from "@/actions/news";
import { redirect } from "next/navigation";
import AdminNewsManager from "@/components/admin/admin-news-manager";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const profile = await getProfile();

  if (!profile || !["admin", "rh", "responsable_qse"].includes(profile.role)) {
    redirect("/");
  }

  const news = await getAllNewsAdmin();

  return (
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--heading)]">
          Gestion des actualités
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Créez, modifiez et publiez les actualités de l&apos;entreprise.
        </p>
      </div>

      <AdminNewsManager news={news} />
    </div>
  );
}
