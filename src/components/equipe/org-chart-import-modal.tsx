"use client";

import { useState, useCallback } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  importOrgChart,
  analyzeOrgChartImage,
  applyAIImport,
  type ImportRow,
  type ImportResult,
  type AIExtractedPerson,
  type OrgChartProfile,
} from "@/actions/organigramme";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface OrgChartImportModalProps {
  open: boolean;
  onClose: () => void;
  profiles: OrgChartProfile[];
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

// ==========================================
// AI MATCH EDITOR
// ==========================================

interface AIMatch {
  extracted: AIExtractedPerson;
  matchedProfileId: string | null;
  matchedManagerId: string | null;
  confidence: "high" | "low" | "none";
  managerConfidence: "high" | "low" | "none";
}

function buildAIMatches(
  extracted: AIExtractedPerson[],
  profiles: OrgChartProfile[]
): AIMatch[] {
  return extracted.map((person) => {
    // Fuzzy match for person
    const { id: matchedId, confidence } = fuzzyMatchProfile(person.name, profiles);

    // Fuzzy match for manager
    let matchedManagerId: string | null = null;
    let managerConfidence: "high" | "low" | "none" = "none";
    if (person.manager_name) {
      const managerMatch = fuzzyMatchProfile(person.manager_name, profiles);
      matchedManagerId = managerMatch.id;
      managerConfidence = managerMatch.confidence;
    }

    return {
      extracted: person,
      matchedProfileId: matchedId,
      matchedManagerId: matchedManagerId,
      confidence,
      managerConfidence,
    };
  });
}

function fuzzyMatchProfile(
  name: string,
  profiles: OrgChartProfile[]
): { id: string | null; confidence: "high" | "low" | "none" } {
  const normalized = name.toLowerCase().trim();

  // Exact match
  for (const p of profiles) {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    if (fullName === normalized) {
      return { id: p.id, confidence: "high" };
    }
  }

  // Reversed name match
  for (const p of profiles) {
    const reversed = `${p.last_name} ${p.first_name}`.toLowerCase();
    if (reversed === normalized) {
      return { id: p.id, confidence: "high" };
    }
  }

  // Partial match (one name contains the other or significant overlap)
  let bestMatch: { id: string; score: number } | null = null;
  for (const p of profiles) {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const nameWords = normalized.split(/\s+/);
    const profileWords = fullName.split(/\s+/);

    // Count matching words
    let matchingWords = 0;
    for (const w of nameWords) {
      if (w.length < 2) continue;
      if (profileWords.some((pw) => pw.includes(w) || w.includes(pw))) {
        matchingWords++;
      }
    }

    const score = matchingWords / Math.max(nameWords.length, profileWords.length);
    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: p.id, score };
    }
  }

  if (bestMatch) {
    return {
      id: bestMatch.id,
      confidence: bestMatch.score > 0.8 ? "high" : "low",
    };
  }

  return { id: null, confidence: "none" };
}

// ==========================================
// MAIN MODAL
// ==========================================

export default function OrgChartImportModal({
  open,
  onClose,
  profiles,
}: OrgChartImportModalProps) {
  const [mode, setMode] = useState<"excel" | "ai">("excel");
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // AI mode state
  const [aiStep, setAiStep] = useState<"upload" | "analyzing" | "preview" | "result">("upload");
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);

  // ========== Excel handlers ==========

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
            department:
              row["Département"] || row["departement"] || row["department"] || "",
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

  // ========== AI handlers ==========

  const handleAIFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setAiStep("analyzing");

      try {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 data after the data URL prefix
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Set preview
        setAiImagePreview(`data:${file.type};base64,${base64}`);

        // Call AI analysis
        const extracted = await analyzeOrgChartImage(base64, file.type);

        if ("error" in extracted) {
          toast.error((extracted as { error: string }).error);
          setAiStep("upload");
          return;
        }

        // Build matches
        const matches = buildAIMatches(extracted as AIExtractedPerson[], profiles);
        setAiMatches(matches);
        setAiStep("preview");
      } catch {
        toast.error("Erreur lors de l'analyse de l'image");
        setAiStep("upload");
      }
    },
    [profiles]
  );

  const handleAIApply = useCallback(async () => {
    setLoading(true);
    try {
      // Build the assignments: profileId → managerId
      const assignments: { profileId: string; managerId: string | null }[] = [];

      for (const match of aiMatches) {
        if (match.matchedProfileId) {
          assignments.push({
            profileId: match.matchedProfileId,
            managerId: match.matchedManagerId,
          });
        }
      }

      const importResult = await applyAIImport(assignments);
      setResult(importResult);
      setAiStep("result");

      if (importResult.errors.length === 0) {
        toast.success(`${importResult.updated} relation(s) mise(s) à jour`);
      } else {
        toast.warning(
          `${importResult.updated} mise(s) à jour, ${importResult.errors.length} erreur(s)`
        );
      }
    } catch {
      toast.error("Erreur lors de l'application");
    } finally {
      setLoading(false);
    }
  }, [aiMatches]);

  const updateAIMatch = useCallback(
    (index: number, field: "matchedProfileId" | "matchedManagerId", value: string | null) => {
      setAiMatches((prev) =>
        prev.map((m, i) =>
          i === index
            ? {
                ...m,
                [field]: value,
                ...(field === "matchedProfileId"
                  ? { confidence: value ? "high" : "none" }
                  : { managerConfidence: value ? "high" : "none" }),
              }
            : m
        )
      );
    },
    []
  );

  // ========== Common ==========

  const handleClose = useCallback(() => {
    setStep("upload");
    setAiStep("upload");
    setRows([]);
    setFileName("");
    setResult(null);
    setAiMatches([]);
    setAiImagePreview(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  const isExcelMode = mode === "excel";
  const currentStep = isExcelMode ? step : aiStep;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && handleClose()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[720px] max-h-[90vh] animate-scale-in overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/[0.04]">
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
                {isExcelMode
                  ? "CSV ou Excel — correspondance par email"
                  : "Image ou PDF — analyse par IA"}
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

        {/* Mode toggle */}
        {currentStep === "upload" && (
          <div className="border-b border-[var(--border-1)] px-6 py-3">
            <div className="flex rounded-lg border border-[var(--border-1)] bg-[var(--hover)] p-0.5">
              <button
                onClick={() => setMode("excel")}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-all flex items-center justify-center gap-1.5",
                  isExcelMode
                    ? "bg-white text-[var(--heading)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--heading)]"
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Fichier Excel / CSV
              </button>
              <button
                onClick={() => setMode("ai")}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-all flex items-center justify-center gap-1.5",
                  !isExcelMode
                    ? "bg-white text-[var(--heading)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--heading)]"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Image / PDF (IA)
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {/* ===== EXCEL MODE ===== */}
          {isExcelMode && (
            <>
              {/* Step 1: Upload */}
              {step === "upload" && (
                <div className="space-y-5">
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
                <ResultView result={result} />
              )}
            </>
          )}

          {/* ===== AI MODE ===== */}
          {!isExcelMode && (
            <>
              {/* AI Upload */}
              {aiStep === "upload" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-dashed border-[var(--border-1)] bg-[var(--hover)] p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-5 w-5 text-[var(--yellow)]" />
                      <div>
                        <p className="text-[13px] font-medium text-[var(--heading)]">
                          Import intelligent par IA
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          Uploadez une capture d&apos;écran ou un PDF de votre organigramme.
                          L&apos;IA analysera l&apos;image et reconstruira automatiquement
                          la hiérarchie en associant les personnes détectées aux
                          collaborateurs existants.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-1)] bg-white px-6 py-10 transition-colors hover:border-[var(--yellow)] hover:bg-[var(--yellow-surface)]/30">
                    <ImageIcon className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium text-[var(--heading)]">
                      Glissez une image ou cliquez
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      .png, .jpg, .jpeg ou .pdf
                    </p>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                      onChange={handleAIFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* AI Analyzing */}
              {aiStep === "analyzing" && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <Sparkles className="h-10 w-10 text-[var(--yellow)] animate-pulse" />
                    <RefreshCw className="absolute -bottom-1 -right-1 h-5 w-5 text-[var(--text-muted)] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--heading)]">
                      Analyse en cours...
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                      L&apos;IA analyse l&apos;organigramme et identifie les collaborateurs
                    </p>
                  </div>
                </div>
              )}

              {/* AI Preview */}
              {aiStep === "preview" && (
                <div className="space-y-4">
                  {/* Image preview (small) */}
                  {aiImagePreview && (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-1)] bg-[var(--hover)] p-3">
                      <img
                        src={aiImagePreview}
                        alt="Organigramme"
                        className="h-16 w-24 rounded-lg border border-[var(--border-1)] object-cover"
                      />
                      <div>
                        <p className="text-[12px] font-medium text-[var(--heading)]">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {aiMatches.length} personne{aiMatches.length > 1 ? "s" : ""} détectée{aiMatches.length > 1 ? "s" : ""}
                        </p>
                        <button
                          onClick={() => {
                            setAiStep("upload");
                            setAiMatches([]);
                            setAiImagePreview(null);
                          }}
                          className="mt-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--heading)]"
                        >
                          Changer d&apos;image
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Matches table */}
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-[var(--text-muted)]">
                      Correspondances trouvées — vérifiez et corrigez si nécessaire
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-[var(--border-1)]">
                      <table className="w-full text-left">
                        <thead className="border-b border-[var(--border-2)] bg-[var(--hover)]">
                          <tr>
                            <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                              Nom détecté (IA)
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                              <ArrowRight className="inline h-3 w-3 mr-0.5" />
                              Profil associé
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                              Poste (IA)
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium uppercase text-[var(--text-muted)]">
                              Manager détecté
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-1)]">
                          {aiMatches.map((match, i) => (
                            <tr
                              key={i}
                              className={cn(
                                "text-[11px]",
                                match.confidence === "none" && "bg-red-50/50",
                                match.confidence === "low" && "bg-yellow-50/50"
                              )}
                            >
                              <td className="px-2 py-1.5">
                                <div className="flex items-center gap-1.5">
                                  {match.confidence === "high" && (
                                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                  )}
                                  {match.confidence === "low" && (
                                    <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                                  )}
                                  {match.confidence === "none" && (
                                    <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                                  )}
                                  <span className="text-[var(--heading)] font-medium">
                                    {match.extracted.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <select
                                  value={match.matchedProfileId ?? ""}
                                  onChange={(e) =>
                                    updateAIMatch(i, "matchedProfileId", e.target.value || null)
                                  }
                                  className={cn(
                                    "w-full rounded border px-1.5 py-1 text-[11px] outline-none",
                                    match.matchedProfileId
                                      ? "border-green-200 bg-green-50/50"
                                      : "border-red-200 bg-red-50/50"
                                  )}
                                >
                                  <option value="">— Non associé —</option>
                                  {profiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.first_name} {p.last_name}
                                      {p.email ? ` (${p.email})` : ""}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-[var(--text-muted)]">
                                {match.extracted.job_title || "—"}
                              </td>
                              <td className="px-2 py-1.5">
                                {match.extracted.manager_name ? (
                                  <select
                                    value={match.matchedManagerId ?? ""}
                                    onChange={(e) =>
                                      updateAIMatch(i, "matchedManagerId", e.target.value || null)
                                    }
                                    className="w-full rounded border border-[var(--border-1)] px-1.5 py-1 text-[11px] outline-none"
                                  >
                                    <option value="">— Aucun —</option>
                                    {profiles.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-[var(--text-muted)]">
                                    Racine
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-3 flex gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {aiMatches.filter((m) => m.confidence === "high").length} sûrs
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        {aiMatches.filter((m) => m.confidence === "low").length} incertains
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {aiMatches.filter((m) => m.confidence === "none").length} non trouvés
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Result */}
              {aiStep === "result" && result && (
                <ResultView result={result} />
              )}
            </>
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
            {currentStep === "result" ? "Fermer" : "Annuler"}
          </button>

          {/* Excel import button */}
          {isExcelMode && step === "preview" && (
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

          {/* AI apply button */}
          {!isExcelMode && aiStep === "preview" && (
            <Button onClick={handleAIApply} disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Application en cours...
                </span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Appliquer {aiMatches.filter((m) => m.matchedProfileId).length} association{aiMatches.filter((m) => m.matchedProfileId).length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// RESULT VIEW (shared)
// ==========================================

function ResultView({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-[13px] font-medium text-green-800">
            {result.updated} profil{result.updated > 1 ? "s" : ""} mis à jour
            sur {result.total}
          </p>
        </div>
      </div>

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
  );
}
