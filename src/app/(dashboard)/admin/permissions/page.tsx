import { getProfile } from "@/actions/auth";
import { getPermissionsMatrix } from "@/actions/permissions";
import PermissionsMatrix from "@/components/admin/permissions-matrix";
import { redirect } from "next/navigation";

export default async function AdminPermissionsPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const matrix = await getPermissionsMatrix();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <h1 className="mb-1 text-lg font-semibold text-[var(--heading)]">
        Permissions par poste
      </h1>
      <p className="mb-6 text-[13px] text-[var(--text-secondary)]">
        Définissez les droits d&apos;accès pour chaque poste de votre organisation.
      </p>

      <PermissionsMatrix initialData={matrix} />
    </div>
  );
}
