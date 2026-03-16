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
    <div className="px-7 py-6 pb-20 md:pb-7">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Actualités
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Les dernières nouvelles de l&apos;entreprise
          </p>
        </div>
        {canCreate && (
          <Link
            href="/actualites/creer"
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2.5 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-[var(--yellow-hover)]"
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
