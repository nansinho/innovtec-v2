"use client";

import type { Rex } from "@/lib/types/database";
import RexDetail from "@/components/qse/rex-detail";
import { exportRexPdf } from "@/lib/export/rex-pdf";

interface Props {
  rex: Rex;
}

export default function RexDetailClient({ rex }: Props) {
  function handleExportPdf() {
    const rexNumber = rex.rex_number || "X";
    const rexYear = rex.rex_year || new Date().getFullYear();
    const filename = `Fiche-REX-${rexNumber}-${rexYear}.pdf`;
    exportRexPdf(rex, filename);
  }

  return <RexDetail rex={rex} onExportPdf={handleExportPdf} />;
}
