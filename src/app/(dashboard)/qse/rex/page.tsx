import { getRexList } from "@/actions/qse";
import RexPageClient from "./page-client";

export const dynamic = "force-dynamic";

export default async function RexPage() {
  const rexList = await getRexList();

  return <RexPageClient rexList={rexList} />;
}
