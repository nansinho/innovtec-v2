import Link from "next/link";
import { Plus } from "lucide-react";
import { getBonnesPratiques } from "@/actions/bonnes-pratiques";
import BonnesPratiquesList from "@/components/qse/bonnes-pratiques-list";

export const dynamic = "force-dynamic";

export default async function BonnesPratiquesPage() {
  const items = await getBonnesPratiques();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <BonnesPratiquesList
        items={items}
        headerAction={
          <Link
            href="/qse/bonnes-pratiques/nouveau"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--green)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle bonne pratique
          </Link>
        }
      />
    </div>
  );
}
