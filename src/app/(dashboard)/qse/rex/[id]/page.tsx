import { getRexById } from "@/actions/qse";
import { getCompanyLogo } from "@/actions/settings";
import { notFound } from "next/navigation";
import RexDetailClient from "./rex-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RexDetailPage({ params }: Props) {
  const { id } = await params;
  const [rex, companyLogo] = await Promise.all([
    getRexById(id),
    getCompanyLogo(),
  ]);

  if (!rex) {
    notFound();
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexDetailClient rex={rex} companyLogo={companyLogo} />
    </div>
  );
}
