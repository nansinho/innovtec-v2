"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Edit3,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Award,
  HeartPulse,
  ShieldCheck,
  Leaf,
  FileText,
  Calendar,
  ArrowLeft,
  Upload,
  Copy,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import FileUploadAi from "@/components/ai/file-upload-ai";
import {
  saveQseContent,
  createQseContent,
  deleteQseContent,
  getQseFileDownloadUrl,
  uploadQseDocumentFile,
  deleteQseDocumentFile,
} from "@/actions/qse";
import type { QseContent, QseContentSection, QseDocument } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

// ==========================================
// PILLAR CONFIG
// ==========================================

const PILLARS = [
  {
    key: "qualite",
    label: "Qualité",
    match: ["qualit", "qual"],
    icon: Award,
    color: "#d97706",
    surface: "rgba(217, 119, 6, 0.08)",
    border: "rgba(217, 119, 6, 0.2)",
    gradient: "from-amber-500/10 to-yellow-500/5",
  },
  {
    key: "sante",
    label: "Santé",
    match: ["sant", "sante", "health"],
    icon: HeartPulse,
    color: "#2563eb",
    surface: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.2)",
    gradient: "from-blue-500/10 to-indigo-500/5",
  },
  {
    key: "securite",
    label: "Sécurité",
    match: ["securit", "surete"],
    icon: ShieldCheck,
    color: "#dc2626",
    surface: "rgba(220, 38, 38, 0.08)",
    border: "rgba(220, 38, 38, 0.2)",
    gradient: "from-red-500/10 to-rose-500/5",
  },
  {
    key: "environnement",
    label: "Environnement",
    match: ["environnement", "environ", "ecolog"],
    icon: Leaf,
    color: "#16a34a",
    surface: "rgba(22, 163, 74, 0.08)",
    border: "rgba(22, 163, 74, 0.2)",
    gradient: "from-green-500/10 to-emerald-500/5",
  },
] as const;


interface Pillar {
  key: string;
  label: string;
  icon: typeof Award;
  color: string;
  surface: string;
  border: string;
  gradient: string;
  engagements: string[];
  objectifs: string[];
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parsePillars(sections: QseContentSection[]): {
  pillars: Pillar[];
  intro: string;
} {
  let intro = "";
  const pillarMap: Record<string, { engagements: string[]; objectifs: string[] }> = {};

  for (const p of PILLARS) {
    pillarMap[p.key] = { engagements: [], objectifs: [] };
  }

  for (const section of sections) {
    const titleNorm = normalize(section.title);

    if (
      titleNorm.includes("presentation") ||
      titleNorm.includes("generale") ||
      titleNorm.includes("introduction")
    ) {
      intro = section.content;
      continue;
    }

    let matched = false;
    for (const p of PILLARS) {
      if (p.match.some((m) => titleNorm.includes(normalize(m)))) {
        const isObjectif =
          titleNorm.includes("objectif") ||
          titleNorm.includes("indicateur") ||
          titleNorm.includes("kpi") ||
          titleNorm.includes("metrique");
        const lines = section.content
          .split("\n")
          .map((l) => l.replace(/^[\s\u2022\u2023\u25E6\u2043\u2219*\-]+/, "").trim())
          .filter((l) => l.length > 0);

        if (isObjectif) {
          pillarMap[p.key].objectifs.push(...lines);
        } else {
          pillarMap[p.key].engagements.push(...lines);
        }
        matched = true;
        break;
      }
    }

    if (!matched && !intro) {
      intro = section.content;
    }
  }

  const pillars: Pillar[] = PILLARS.map((p) => ({
    key: p.key,
    label: p.label,
    icon: p.icon,
    color: p.color,
    surface: p.surface,
    border: p.border,
    gradient: p.gradient,
    engagements: pillarMap[p.key].engagements,
    objectifs: pillarMap[p.key].objectifs,
  })).filter((p) => p.engagements.length > 0 || p.objectifs.length > 0);

  return { pillars, intro };
}

// ==========================================
// PILLAR CARD COMPONENT
// ==========================================

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon;
  const totalItems = pillar.engagements.length + pillar.objectifs.length;

  return (
    <div
      className={cn(
        "group/pillar overflow-hidden rounded-[var(--radius)] border bg-[var(--card)] shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{ borderColor: pillar.border }}
    >
      {/* Header with gradient accent */}
      <div className={cn("relative flex items-center gap-3 px-5 py-4 bg-gradient-to-r", pillar.gradient)}>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover/pillar:scale-110"
          style={{ background: pillar.surface }}
        >
          <Icon className="h-5 w-5" style={{ color: pillar.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-[var(--heading)]">
            {pillar.label}
          </h3>
          <p className="text-[10px] text-[var(--text-muted)]">
            {pillar.engagements.length} engagement{pillar.engagements.length > 1 ? "s" : ""}
            {pillar.objectifs.length > 0 && ` · ${pillar.objectifs.length} objectif${pillar.objectifs.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: pillar.surface, color: pillar.color }}
        >
          {totalItems}
        </span>
        {/* Decorative accent bar */}
        <div
          className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full opacity-30"
          style={{ background: pillar.color }}
        />
      </div>

      {/* Engagements */}
      {pillar.engagements.length > 0 && (
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-1 w-6 rounded-full"
              style={{ background: pillar.color }}
            />
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
              Nos engagements
            </span>
          </div>
          <ul className="space-y-2.5">
            {pillar.engagements.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--text)]">
                <span
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{ background: pillar.color }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objectifs */}
      {pillar.objectifs.length > 0 && (
        <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--navy)] to-[#1e3a5f] px-4 py-4 shadow-inner">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[var(--yellow)]" />
            <span className="text-[10px] font-semibold text-white/60">
              Nos objectifs
            </span>
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/50">
              {pillar.objectifs.length}
            </span>
          </div>
          <ul className="space-y-2">
            {pillar.objectifs.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-white/90">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface PolitiqueContentProps {
  content: QseContent | null;
  allContent: QseContent[];
  canEdit: boolean;
  fileUrls?: Record<string, string>;
}

export default function PolitiqueContent({
  content,
  allContent,
  canEdit,
  fileUrls = {},
}: PolitiqueContentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(
    content?.title ?? "Politique Qualité, Sécurité et Environnement"
  );
  const [sections, setSections] = useState<QseContentSection[]>(
    content?.sections ?? []
  );
  const [sourceFileUrl, setSourceFileUrl] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [dateSignature, setDateSignature] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [documents, setDocuments] = useState<QseDocument[]>([]);
  const [engagementText, setEngagementText] = useState("");
  const [engagementLieu, setEngagementLieu] = useState("");
  const [signataires, setSignataires] = useState<string[]>([]);
  const [uploadingDocIndex, setUploadingDocIndex] = useState<number | null>(null);
  const [introText, setIntroText] = useState("");
  const [pillarData, setPillarData] = useState<Record<string, { engagements: string; objectifs: string }>>({});
  const router = useRouter();

  const selected = allContent.find((c) => c.id === selectedId) ?? null;
  const { pillars, intro } = selected
    ? parsePillars(selected.sections)
    : { pillars: [], intro: "" };

  function getDocYear(doc: QseContent): number {
    return doc.year ?? new Date(doc.updated_at).getFullYear();
  }

  // Convert sections array to pillar-based edit state
  function sectionsToEditState(secs: QseContentSection[]) {
    const pd: Record<string, { engagements: string; objectifs: string }> = {};
    for (const p of PILLARS) {
      pd[p.key] = { engagements: "", objectifs: "" };
    }
    let intro = "";

    for (const section of secs) {
      const titleNorm = normalize(section.title);

      if (
        titleNorm.includes("presentation") ||
        titleNorm.includes("generale") ||
        titleNorm.includes("introduction")
      ) {
        intro = section.content;
        continue;
      }

      for (const p of PILLARS) {
        if (p.match.some((m) => titleNorm.includes(normalize(m)))) {
          const isObjectif =
            titleNorm.includes("objectif") ||
            titleNorm.includes("indicateur") ||
            titleNorm.includes("kpi") ||
            titleNorm.includes("metrique");
          if (isObjectif) {
            pd[p.key].objectifs = section.content;
          } else {
            pd[p.key].engagements = section.content;
          }
          break;
        }
      }
    }

    return { introText: intro, pillarData: pd };
  }

  // Convert pillar-based edit state back to sections array
  function editStateToSections(): QseContentSection[] {
    const secs: QseContentSection[] = [];
    if (introText.trim()) {
      secs.push({ title: "Présentation générale", content: introText });
    }
    for (const p of PILLARS) {
      const data = pillarData[p.key];
      if (data?.engagements?.trim()) {
        secs.push({ title: `${p.label.toUpperCase()} - Nos engagements`, content: data.engagements });
      }
      if (data?.objectifs?.trim()) {
        secs.push({ title: `${p.label.toUpperCase()} - Nos objectifs`, content: data.objectifs });
      }
    }
    return secs;
  }

  function updatePillar(key: string, field: "engagements" | "objectifs", value: string) {
    setPillarData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function handleAiResult(result: unknown, fileUrl?: string) {
    const data = result as {
      title?: string;
      year?: number;
      date_signature?: string;
      engagement_text?: string;
      engagement_lieu?: string;
      signataires?: string[];
      sections?: QseContentSection[];
    };

    console.log("[QSE AI Import] Raw result:", JSON.stringify(data, null, 2));

    if (data.title) setTitle(data.title);
    if (data.year) setYear(data.year);
    if (data.date_signature) setDateSignature(data.date_signature);
    if (data.engagement_text) setEngagementText(data.engagement_text);
    if (data.engagement_lieu) setEngagementLieu(data.engagement_lieu);
    if (data.signataires && Array.isArray(data.signataires)) setSignataires(data.signataires);
    if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
      setSections(data.sections);
      const state = sectionsToEditState(data.sections);
      console.log("[QSE AI Import] Parsed pillarData:", JSON.stringify(state, null, 2));
      setIntroText(state.introText);
      setPillarData(state.pillarData);
      const filledPillars = Object.values(state.pillarData).filter(
        (p) => p.engagements.trim() || p.objectifs.trim()
      ).length;
      toast.success(`Import IA : ${data.sections.length} sections détectées, ${filledPillars} piliers remplis`);
    } else {
      toast.error("L'IA n'a pas pu extraire de sections du document");
      console.warn("[QSE AI Import] No sections found in result:", data);
    }
    if (fileUrl) setSourceFileUrl(fileUrl);
    setEditing(true);
    setShowUpload(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const finalSections = editStateToSections();
        let result;
        if (editingId) {
          result = await saveQseContent("politique", title, finalSections, sourceFileUrl || undefined, editingId, year, dateSignature, documents, engagementText, engagementLieu, signataires);
        } else {
          result = await createQseContent("politique", title, finalSections, sourceFileUrl || undefined, year, dateSignature, documents, engagementText, engagementLieu, signataires);
        }
        if (result.success) {
          toast.success("Politique QSE enregistrée avec succès");
          setEditing(false);
          setEditingId(null);
          setSourceFileUrl("");
          setYear(null);
          setDateSignature(null);
          setDocuments([]);
          setEngagementText("");
          setEngagementLieu("");
          setSignataires([]);
          setIntroText("");
          setPillarData({});
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors de l'enregistrement");
        }
      } catch (err) {
        toast.error("Erreur lors de l'enregistrement");
        console.error("Save error:", err);
      }
    });
  }

  function initEditState(secs: QseContentSection[]) {
    const state = sectionsToEditState(secs);
    setIntroText(state.introText);
    setPillarData(state.pillarData);
  }

  function startEditing(doc: QseContent) {
    setTitle(doc.title);
    setSections(doc.sections);
    initEditState(doc.sections);
    setEditingId(doc.id);
    setYear(doc.year ?? null);
    setDateSignature(doc.date_signature ?? null);
    setSourceFileUrl(doc.source_file_url ?? "");
    setDocuments(doc.documents ?? []);
    setEngagementText(doc.engagement_text ?? "");
    setEngagementLieu(doc.engagement_lieu ?? "");
    setSignataires(doc.signataires ?? []);
    setEditing(true);
    setSelectedId(null);
  }

  function startNew() {
    setTitle("Politique Qualité, Sécurité et Environnement");
    setSections([]);
    initEditState([]);
    setEditingId(null);
    setYear(new Date().getFullYear());
    setDateSignature(null);
    setSourceFileUrl("");
    setDocuments([]);
    setEngagementText("");
    setEngagementLieu("");
    setSignataires([]);
    setEditing(true);
    setSelectedId(null);
  }

  function duplicateDoc(doc: QseContent) {
    setTitle(doc.title);
    setSections([...doc.sections]);
    initEditState(doc.sections);
    setEditingId(null);
    setYear(new Date().getFullYear());
    setDateSignature(null);
    setSourceFileUrl("");
    setDocuments([...(doc.documents ?? [])]);
    setEngagementText(doc.engagement_text ?? "");
    setEngagementLieu(doc.engagement_lieu ?? "");
    setSignataires([...(doc.signataires ?? [])]);
    setEditing(true);
    setSelectedId(null);
  }

  function handleDelete(id: string, docTitle: string) {
    if (!window.confirm(`Supprimer la politique "${docTitle}" ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      const result = await deleteQseContent(id);
      if (result.success) {
        toast.success("Politique supprimée");
        if (selectedId === id) setSelectedId(null);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  }

  async function handleDownloadFile(filePath: string) {
    setIsDownloading(true);
    try {
      const { url, error } = await getQseFileDownloadUrl(filePath);
      if (url) window.open(url, "_blank");
      else if (error) console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  // ==========================================
  // EDIT MODE
  // ==========================================
  if (editing) {
    return (
      <div className="space-y-5">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--yellow)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={() => { setEditing(false); setEditingId(null); setShowUpload(false); }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--card)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:shadow-sm active:scale-[0.98]"
          >
            Annuler
          </button>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-4 py-2 text-[13px] font-medium text-[var(--navy)] transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
              Importer un PDF / Image (IA)
            </button>
          )}
        </div>

        {/* Upload zone */}
        {showUpload && (
          <div className="rounded-xl border border-[var(--border-1)] bg-gradient-to-b from-[var(--card)] to-[var(--hover)] p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <Upload className="h-4 w-4 text-[var(--yellow)]" />
              <h3 className="text-sm font-semibold text-[var(--heading)]">Import IA</h3>
            </div>
            <p className="mb-4 text-[12px] text-[var(--text-muted)]">
              L&apos;IA va analyser votre document et générer automatiquement le contenu structuré.
            </p>
            <FileUploadAi onAnalysisComplete={handleAiResult} type="politique" label="Importer votre politique QSE (PDF ou image)" />
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          {/* Year + Date signature + Title header */}
          <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
            <div className="flex flex-wrap gap-4 p-5">
              <div className="w-24 shrink-0">
                <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Année</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year ?? new Date().getFullYear()}
                  onChange={(e) => setYear(parseInt(e.target.value) || null)}
                  className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
              <div className="w-40 shrink-0">
                <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Date signature</label>
                <input
                  type="date"
                  value={dateSignature ?? ""}
                  onChange={(e) => setDateSignature(e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Titre du document</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
            </div>
          </div>

          {/* Présentation générale */}
          <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
            <div className="flex items-center gap-3 border-b border-[var(--border-1)] px-5 py-4">
              <FileText className="h-5 w-5 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--heading)]">Présentation générale</h3>
            </div>
            <div className="p-5">
              <textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="Décrivez la politique générale de l'entreprise en matière de Qualité, Sécurité et Environnement..."
                rows={4}
                className="w-full resize-none rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
          </div>

          {/* Pillar cards - full width, one per row */}
          <div className="space-y-5">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              const data = pillarData[p.key] ?? { engagements: "", objectifs: "" };
              return (
                <div
                  key={p.key}
                  className="overflow-hidden rounded-xl border bg-[var(--card)] shadow-sm"
                  style={{ borderColor: p.border }}
                >
                  {/* Pillar header */}
                  <div
                    className={cn("flex items-center gap-3 px-6 py-4 bg-gradient-to-r", p.gradient)}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: p.surface }}
                    >
                      <Icon className="h-5 w-5" style={{ color: p.color }} />
                    </div>
                    <h3 className="text-[15px] font-semibold" style={{ color: p.color }}>
                      {p.label}
                    </h3>
                  </div>

                  {/* Two columns: Engagements | Objectifs */}
                  <div className="grid grid-cols-2 divide-x divide-[var(--border-1)]">
                    <div className="p-5">
                      <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                        <div className="h-1 w-4 rounded-full" style={{ background: p.color }} />
                        Engagements
                      </label>
                      <textarea
                        value={data.engagements}
                        onChange={(e) => updatePillar(p.key, "engagements", e.target.value)}
                        placeholder={"Un engagement par ligne..."}
                        rows={6}
                        className="w-full resize-none rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                      />
                    </div>
                    <div className="p-5">
                      <label className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                        <div className="h-1 w-4 rounded-full bg-[var(--navy)]" />
                        Objectifs
                      </label>
                      <textarea
                        value={data.objectifs}
                        onChange={(e) => updatePillar(p.key, "objectifs", e.target.value)}
                        placeholder={"Un objectif par ligne..."}
                        rows={6}
                        className="w-full resize-none rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents Obligatoires */}
        <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border-1)] px-5 py-4">
            <FileText className="h-5 w-5 text-[var(--yellow)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Documents obligatoires</h3>
          </div>
          <div className="divide-y divide-[var(--border-1)]">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <input
                    value={doc.title}
                    onChange={(e) => {
                      const updated = [...documents];
                      updated[index] = { ...updated[index], title: e.target.value };
                      setDocuments(updated);
                    }}
                    placeholder="Titre du document"
                    className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.file_url ? (
                    <span className="rounded-lg bg-green-50 px-2.5 py-1.5 text-[11px] font-medium text-green-600">
                      Fichier joint
                    </span>
                  ) : (
                    <label className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-1)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--hover)]",
                      uploadingDocIndex === index && "pointer-events-none opacity-50"
                    )}>
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingDocIndex === index ? "Upload..." : "Fichier"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingDocIndex(index);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const result = await uploadQseDocumentFile(formData);
                            if (result.filePath) {
                              const updated = [...documents];
                              updated[index] = { ...updated[index], file_url: result.filePath };
                              setDocuments(updated);
                            } else if (result.error) {
                              toast.error(result.error);
                            }
                          } finally {
                            setUploadingDocIndex(null);
                          }
                        }}
                      />
                    </label>
                  )}
                  {doc.file_url && (
                    <button
                      onClick={async () => {
                        await deleteQseDocumentFile(doc.file_url);
                        const updated = [...documents];
                        updated[index] = { ...updated[index], file_url: "" };
                        setDocuments(updated);
                      }}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] transition-all hover:bg-orange-50 hover:text-orange-500"
                      title="Retirer le fichier"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (doc.file_url) deleteQseDocumentFile(doc.file_url);
                      setDocuments(documents.filter((_, i) => i !== index));
                    }}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button
              onClick={() => setDocuments([...documents, { title: "", file_url: "" }])}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-1)] py-3 text-[13px] font-medium text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--yellow)] hover:bg-[var(--yellow-surface)] hover:text-[var(--yellow)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter un document
            </button>
          </div>
        </div>

        {/* Engagement de la direction */}
        <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border-1)] px-5 py-4">
            <Award className="h-5 w-5 text-[var(--green)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Engagement de la direction</h3>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Texte d&apos;engagement</label>
              <textarea
                value={engagementText}
                onChange={(e) => setEngagementText(e.target.value)}
                placeholder="La direction s'engage à mettre en œuvre les moyens nécessaires..."
                rows={4}
                className="w-full resize-none rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Lieu</label>
                <input
                  value={engagementLieu}
                  onChange={(e) => setEngagementLieu(e.target.value)}
                  placeholder="Gardanne"
                  className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
              <div className="w-40">
                <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Date signature</label>
                <input
                  type="date"
                  value={dateSignature ?? ""}
                  onChange={(e) => setDateSignature(e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--text-muted)]">Signataires</label>
              <div className="space-y-2">
                {signataires.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={name}
                      onChange={(e) => {
                        const updated = [...signataires];
                        updated[index] = e.target.value;
                        setSignataires(updated);
                      }}
                      placeholder="Nom du signataire"
                      className="flex-1 rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                    />
                    <button
                      onClick={() => setSignataires(signataires.filter((_, i) => i !== index))}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSignataires([...signataires, ""])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border-1)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-all hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter un signataire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedId && selected) {
    const docYear = getDocYear(selected);
    const hasFile = selected.source_file_url && selected.source_file_url.length > 0;
    const fileUrl = fileUrls[selected.id] || null;
    const isImageFile = selected.source_file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const imageUrl = fileUrl && isImageFile ? fileUrl : null;

    return (
      <div className="space-y-5">
        {/* Navigation + actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEditing(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--yellow)] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-md active:scale-[0.98]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={() => duplicateDoc(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--hover)] active:scale-[0.98]"
              >
                <Copy className="h-3.5 w-3.5" />
                Dupliquer
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--navy)] transition-all duration-200 hover:bg-[var(--navy)] hover:text-white active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Réimporter
              </button>
              <button
                onClick={() => handleDelete(selected.id, selected.title)}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3.5 py-1.5 text-[13px] font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          )}
        </div>

        {showUpload && (
          <div className="rounded-xl border border-[var(--border-1)] bg-gradient-to-b from-[var(--card)] to-[var(--hover)] p-6 shadow-sm">
            <FileUploadAi
              onAnalysisComplete={(result, fileUrl) => { handleAiResult(result, fileUrl); setEditingId(selected.id); }}
              type="politique"
              label="Importer votre politique QSE (PDF ou image)"
            />
          </div>
        )}

        {/* Content: image or structured view */}
        {imageUrl ? (
          <div className="space-y-4">
            {/* Original imported image */}
            <div className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-lg transition-shadow duration-300 hover:shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={selected.title} className="w-full h-auto" />
            </div>

            {/* Actions below image */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownloadFile(selected.source_file_url)}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--navy)] to-[#2a4a7a] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Chargement..." : "Télécharger le document"}
              </button>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Calendar className="h-3 w-3" />
                {selected.date_signature
                  ? `Signé le ${formatDate(selected.date_signature, "d MMMM yyyy")}`
                  : `Mis à jour le ${formatDate(selected.updated_at, "d MMMM yyyy")}`}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Download button for non-image files (PDF, etc.) */}
            {hasFile && !isImageFile && (
              <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-4 shadow-xs">
                <Download className="h-5 w-5 text-[var(--navy)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--heading)]">Document source disponible</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selected.date_signature
                      ? `Signé le ${formatDate(selected.date_signature, "d MMMM yyyy")}`
                      : `Mis à jour le ${formatDate(selected.updated_at, "d MMMM yyyy")}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadFile(selected.source_file_url)}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--navy-dark)] disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Chargement..." : "Télécharger"}
                </button>
              </div>
            )}

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#2a4a7a] px-8 py-10 shadow-lg">
              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[var(--yellow)]/10" />

              <div className="relative">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--yellow)]/15 px-3.5 py-1 text-[11px] font-semibold text-[var(--yellow)] backdrop-blur-sm">
                  <Award className="h-3 w-3" />
                  Politique QSE {docYear}
                </span>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-white">
                  {selected.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-white/40">
                  {selected.date_signature && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Signé le {formatDate(selected.date_signature, "d MMMM yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Mis à jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Introduction */}
            {intro && (
              <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] px-6 py-5 shadow-sm">
                <p className="text-[13px] leading-[1.7] text-[var(--text)]">
                  {intro}
                </p>
              </div>
            )}

            {/* Pillars Grid */}
            {pillars.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {pillars.map((pillar) => (
                  <PillarCard key={pillar.key} pillar={pillar} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {selected.sections.map((section, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <h3 className="mb-2 text-[13px] font-semibold text-[var(--heading)]">{section.title}</h3>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text)]">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Obligatoires */}
            {selected.documents && selected.documents.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#2a4a7a] shadow-lg">
                <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
                  <FileText className="h-5 w-5 text-[var(--yellow)]" />
                  <h3 className="text-[15px] font-bold text-white">Documents Obligatoires</h3>
                </div>
                <div className="divide-y divide-white/10">
                  {selected.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-white">{doc.title || "Document sans titre"}</p>
                        {doc.file_url ? (
                          <p className="mt-0.5 text-[11px] text-[var(--yellow)]">Télécharger le document</p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-[var(--yellow)]">Aucun document</p>
                        )}
                      </div>
                      {doc.file_url && (
                        <button
                          onClick={() => handleDownloadFile(doc.file_url)}
                          disabled={isDownloading}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--yellow)]/20 text-[var(--yellow)] transition-all hover:bg-[var(--yellow)]/30 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement de la direction */}
            {selected.engagement_text && (
              <div className="overflow-hidden rounded-xl border-2 border-[var(--green)] bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#2a4a7a] shadow-lg">
                <div className="px-8 py-8">
                  <p className="mb-2 text-center text-[12px] font-semibold text-[var(--green)]">
                    Notre engagement
                  </p>
                  <h3 className="mb-6 text-center text-xl font-bold text-white">
                    Engagement de la direction
                  </h3>
                  <p className="text-[13px] leading-[1.8] text-white/80">
                    {selected.engagement_text}
                  </p>
                  <div className="mt-6 text-right">
                    {(selected.engagement_lieu || selected.date_signature) && (
                      <p className="text-[13px] italic text-white/60">
                        {selected.engagement_lieu && `Fait à ${selected.engagement_lieu}`}
                        {selected.engagement_lieu && selected.date_signature && " le "}
                        {!selected.engagement_lieu && selected.date_signature && "Le "}
                        {selected.date_signature && formatDate(selected.date_signature, "dd/MM/yyyy")}
                      </p>
                    )}
                    {selected.signataires && selected.signataires.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {selected.signataires.map((name, i) => (
                          <p key={i} className="text-[13px] font-semibold text-white">
                            {name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[var(--border-1)] pt-4 text-center text-[11px] text-[var(--text-muted)]">
              Document mis à jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
              {selected.date_signature && ` · Signé le ${formatDate(selected.date_signature, "d MMMM yyyy")}`}
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // LIST VIEW (DataTable)
  // ==========================================
  return (
    <div>
      {/* Header — style C&CO */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--heading)]">Politique QSE</h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
            La politique Qualité, Sécurité et Environnement d&apos;INNOVTEC Réseaux.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStandardToolbarActions().map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border-1)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-xs transition-all hover:bg-zinc-50 hover:text-[var(--heading)] hover:border-zinc-300 active:scale-[0.98]"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}
          {canEdit && (
            <>
              <button
                onClick={() => { setShowUpload(!showUpload); setEditingId(null); }}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border-1)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-xs transition-all hover:bg-zinc-50 hover:text-[var(--heading)] hover:border-zinc-300 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Importer (IA)</span>
              </button>
              <Button size="sm" onClick={startNew}>
                <Plus className="h-3.5 w-3.5" />
                Nouvelle politique QSE
              </Button>
            </>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="mb-5 rounded-lg border border-[var(--border-1)] bg-white p-6 shadow-xs">
          <div className="mb-1 flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--yellow)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Import IA</h3>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            L&apos;IA va analyser votre document et générer automatiquement le contenu structuré.
          </p>
          <FileUploadAi onAnalysisComplete={handleAiResult} type="politique" label="Importer votre politique QSE (PDF ou image)" />
        </div>
      )}

      {/* Table view */}
      {allContent.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200/60">
            <FileText className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-[var(--heading)]">
            Aucune politique QSE
          </p>
          {canEdit && (
            <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--text-muted)]">
              Créez une nouvelle politique ou importez un PDF/image pour commencer.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-2)] bg-[var(--hover)]">
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Titre</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]" style={{ width: "80px" }}>Année</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]" style={{ width: "130px" }}>Signature</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Piliers</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]" style={{ width: "130px" }}>Date</th>
                {canEdit && (
                  <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]" style={{ width: "120px" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {allContent.map((doc) => {
                const docYear = getDocYear(doc);
                const docPillars = parsePillars(doc.sections).pillars;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className="cursor-pointer transition-colors duration-150 hover:bg-[var(--hover)]"
                  >
                    <td className="px-3 py-2">
                      <span className="text-[13px] font-medium text-[var(--heading)]">
                        {doc.title}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="amber">
                        {docYear}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[13px] text-[var(--text-muted)]">
                      {doc.date_signature
                        ? formatDate(doc.date_signature)
                        : <span className="text-[var(--text-muted)]/50">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {docPillars.map((p) => {
                          const Icon = p.icon;
                          return (
                            <Badge
                              key={p.key}
                              dot={false}
                              className="border"
                              style={{
                                backgroundColor: `${p.color}15`,
                                color: p.color,
                                borderColor: `${p.color}30`,
                              }}
                            >
                              <Icon className="h-3 w-3" />
                              {p.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[13px] text-[var(--text-muted)]">
                      {formatDate(doc.updated_at)}
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2 text-right">
                        <DropdownMenu
                          items={[
                            { label: "Dupliquer", icon: Copy, onClick: () => duplicateDoc(doc) },
                            { label: "Modifier", icon: Edit3, onClick: () => startEditing(doc) },
                            { label: "Supprimer", icon: Trash2, variant: "danger", onClick: () => handleDelete(doc.id, doc.title) },
                          ]}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-[var(--border-1)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
            {allContent.length} politique{allContent.length > 1 ? "s" : ""} QSE
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
