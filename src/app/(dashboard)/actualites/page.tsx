import { getNewsWithViewCounts } from "@/actions/news";
import { getProfile } from "@/actions/auth";
import NewsTable from "@/components/news/news-grid";
import Link from "next/link";
import { Plus } from "lucide-react";


export default async function ActualitesPage() {
  const [news, profile] = await Promise.all([
    getNewsWithViewCounts(),
    getProfile(),
  ]);

  const canCreate =
    profile &&
    ["admin", "rh", "responsable_qse"].includes(profile.role);

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--heading)]">
            Actualités
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Les dernières nouvelles de l&apos;entreprise
          </p>
        </div>
        {canCreate && (
          <Link
            href="/actualites/creer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--yellow)] px-3 text-xs font-medium text-white shadow-sm transition-all hover:bg-[var(--yellow-hover)] active:scale-[0.98]"
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
