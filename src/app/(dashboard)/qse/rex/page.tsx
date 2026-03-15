import { getRexList } from "@/actions/qse";
import RexList from "@/components/qse/rex-list";
import RexFormWrapper from "@/components/qse/rex-form-wrapper";

export const dynamic = "force-dynamic";

export default async function RexPage() {
  const rexList = await getRexList();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexList rexList={rexList} headerAction={<RexFormWrapper />} />
    </div>
  );
}
