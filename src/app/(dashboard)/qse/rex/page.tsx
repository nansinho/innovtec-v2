import { getRexList } from "@/actions/qse";
import RexList from "@/components/qse/rex-list";
import RexFormWrapper from "@/components/qse/rex-form-wrapper";

export const dynamic = "force-dynamic";

export default async function RexPage() {
  const rexList = await getRexList();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Retours d&apos;expérience (REX)
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Partagez et consultez les retours d&apos;expérience des chantiers.
          </p>
        </div>
        <RexFormWrapper />
      </div>

      <RexList rexList={rexList} />
    </div>
  );
}
