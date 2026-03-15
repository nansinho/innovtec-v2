import Link from "next/link";
import { Plus } from "lucide-react";
import { getRexList } from "@/actions/qse";
import RexList from "@/components/qse/rex-list";

export const dynamic = "force-dynamic";

export default async function RexPage() {
  const rexList = await getRexList();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexList
        rexList={rexList}
        headerAction={
          <Link
            href="/qse/rex/nouveau"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouveau REX
          </Link>
        }
      />
    </div>
  );
}
