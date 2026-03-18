"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Rex } from "@/lib/types/database";
import type { CompanyLogos } from "@/actions/settings";
import RexDetail from "@/components/qse/rex-detail";
import RexForm from "@/components/qse/rex-form";
import type { RexAuthorOption } from "@/components/qse/rex-form";

interface Props {
  rex: Rex;
  companyLogo: CompanyLogos;
  profiles?: RexAuthorOption[];
}

export default function RexDetailClient({ rex, companyLogo, profiles = [] }: Props) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  async function handleExportPdf() {
    const { exportRexPdf } = await import("@/lib/export/rex-pdf");
    const rexNumber = rex.rex_number || "X";
    const rexYear = rex.rex_year || new Date().getFullYear();
    const filename = `Fiche-REX-${rexNumber}-${rexYear}.pdf`;
    const logoUrl = companyLogo?.light || companyLogo?.dark || null;
    exportRexPdf(rex, filename, logoUrl);
  }

  return (
    <>
      <RexDetail
        rex={rex}
        onExportPdf={handleExportPdf}
        onEdit={() => setEditing(true)}
        companyLogo={companyLogo}
      />

      {editing && (
        <RexForm
          initialData={rex}
          onCreated={() => {
            setEditing(false);
            router.refresh();
          }}
          onClose={() => setEditing(false)}
          profiles={profiles}
        />
      )}
    </>
  );
}
