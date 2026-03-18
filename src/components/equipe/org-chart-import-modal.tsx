"use client";

import { useState, useCallback } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { importOrgChart, type ImportRow, type ImportResult } from "@/actions/organigramme";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface OrgChartImportModalProps {
  open: boolean;
  onClose: () => void;
}

const TEMPLATE_COLUMNS = [
  "Email",
  "Prénom",
  "Nom",
  "Poste",
  "Département",
  "Équipe",
  "Email Manager",
];

export default function OrgChartImportModal({
  open,
  onClose,
}: OrgChartImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS,
      [
        "jean.dupont@innovtec.fr",
        "Jean",
        "Dupont",
        "Conducteur de Travaux",
        "Travaux",
        "Équipe Nord",
        "nuno.aguiar@innovtec.fr",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organigramme");
    XLSX.writeFile(wb, "template_organigramme.xlsx");
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const wb = XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

          const parsed: ImportRow[] = jsonData.map((row) => ({
            email: row["Email"] || row["email"] || "",
            first_name: row["Prénom"] || row["prenom"] || row["first_name"] || "",
            last_name: row["Nom"] || row["nom"] || row["last_name"] || "",
            job_title: row["Poste"] || row["poste"] || row["job_title"] || "",
            department: row["Département"] || row["departement"] || row["department"] || "",
            team: row["Équipe"] || row["equipe"] || row["team"] || "",
            manager_email:
              row["Email Manager"] || row["email_manager"] || row["manager_email"] || "",
          }));

          setRows(parsed.filter((r) => r.email));
          setStep("preview");
        } catch {
          toast.error("Erreur lors de la lecture du fichier");
        }
      };
      reader.readAsBinaryString(file);
    },
    []
  );

  const handleImport = useCallback(async () => {
    setLoading(true);
    try {
      const importResult = await importOrgChart(rows);
      setResult(importResult);
      setStep("result");
      if (importResult.errors.length === 0) {
        toast.success(`${importResult.updated} profil(s) mis à jour`);
      } else {
        toast.warning(
          `${importResult.updated} mis à jour, ${importResult.errors.length} erreur(s)`
        );
      }
    } catch {
      toast.error("Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  }, [rows]);

  const handleClose = useCallback(() => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setResult(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && handleClose()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[640px] max-h-[90vh] animate-scale-in overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/[0.04]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--yellow-surface)]">
              <Upload className="h-4 w-4 text-[var(--yellow)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--heading)]">
                Importer l&apos;organigramme
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                CSV ou Excel — correspondance par email
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--heading)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Template download */}
              <div className="rounded-xl border border-dashed border-[var(--border-1)] bg-[var(--hover)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--heading)]">
                        Template Excel
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Téléchargez le modèle et remplissez-le
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </Button>
                </div>
              </div>

              {/* Columns info */}
              <div>
                <p className="mb-2 text-[11px] font-semibold text-[var(--text-muted)]">
                  Colonnes attendues
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_COLUMNS.map((col) => (
                    <span
                      key={col}
                      className="rounded-md bg-[var(--hover)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* File input */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-1)] bg-white px-6 py-10 transition-colors hover:border-[var(--yellow)] hover:bg-[var(--yellow-surface)]/30">
                <Upload className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
                <p className="text-sm font-medium text-[var(--heading)]">
                  Glissez un fichier ou cliquez
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  .xlsx, .xls ou .csv
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-[var(--heading)]">
                  <FileSpreadsheet className="mr-1.5 inline h-4 w-4 text-green-600" />
                  {fileName} — {rows.length} ligne{rows.length > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => {
                    setStep("upload");
                    setRows([]);
                    setFileName("");
                  }}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--heading)]"
                >
                  Changer de fichier
                </button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-[var(--border-1)]">
                <table className="w-full text-left">
                  <thead className="border-b border-[var(--border-2)] bg-[var(--hover)]">
                    <tr>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        #
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        Email
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        Nom
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        Poste
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        Dept.
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                        Manager
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-1)]">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="text-[11px]">
                        <td className="px-2 py-1.5 text-[var(--text-muted)]">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--heading)]">
                          {row.email}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--text)]">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--text)]">
                          {row.job_title || "—"}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--text)]">
                          {row.department || "—"}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--text)]">
                          {row.manager_email || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <div className="border-t border-[var(--border-1)] bg-[var(--hover)] px-3 py-1.5 text-center text-[10px] text-[var(--text-muted)]">
                    ... et {rows.length - 20} autres lignes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === "result" && result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-[13px] font-medium text-green-800">
                    {result.updated} profil{result.updated > 1 ? "s" : ""} mis à
                    jour sur {result.total}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-[12px] font-medium text-red-800">
                      {result.errors.length} erreur
                      {result.errors.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-red-700">
                        Ligne {err.row}
                        {err.email ? ` (${err.email})` : ""} : {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-[var(--border-1)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-black/[0.03] disabled:opacity-50"
          >
            {step === "result" ? "Fermer" : "Annuler"}
          </button>
          {step === "preview" && (
            <Button onClick={handleImport} disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Import en cours...
                </span>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Importer {rows.length} ligne{rows.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
