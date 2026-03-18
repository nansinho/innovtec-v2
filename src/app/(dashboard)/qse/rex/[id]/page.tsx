import { getRexById } from "@/actions/qse";
import { getCompanyLogo } from "@/actions/settings";
import { getAllUsers } from "@/actions/users";
import { notFound } from "next/navigation";
import RexDetailClient from "./rex-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RexDetailPage({ params }: Props) {
  const { id } = await params;
  const [rex, companyLogo, allUsers] = await Promise.all([
    getRexById(id),
    getCompanyLogo(),
    getAllUsers(),
  ]);

  if (!rex) {
    notFound();
  }

  const profiles = allUsers
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name }));

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexDetailClient rex={rex} companyLogo={companyLogo} profiles={profiles} />
    </div>
  );
}
