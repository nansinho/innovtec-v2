import { getNewsWithViewCounts } from "@/actions/news";
import { getProfile } from "@/actions/auth";
import NewsTable from "@/components/news/news-grid";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  const [news, profile] = await Promise.all([
    getNewsWithViewCounts(),
    getProfile(),
  ]);

  const canCreate =
    profile &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <div className="px-8 py-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Actualités
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Les dernières nouvelles de l&apos;entreprise
          </p>
        </div>
        {canCreate && (
          <Link
            href="/actualites/creer"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Créer un article
          </Link>
        )}
      </div>

      {/* News table */}
      <NewsTable news={news} />
    </div>
  );
}
