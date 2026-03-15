"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Rex } from "@/lib/types/database";
import type { CompanyLogos } from "@/actions/settings";
import RexDetail from "@/components/qse/rex-detail";
import RexForm from "@/components/qse/rex-form";
import { exportRexPdf } from "@/lib/export/rex-pdf";

interface Props {
  rex: Rex;
  companyLogo: CompanyLogos;
}

export default function RexDetailClient({ rex, companyLogo }: Props) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  function handleExportPdf() {
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
        />
      )}
    </>
  );
}
