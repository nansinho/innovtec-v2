"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { saveCompanyLogo, deleteCompanyLogo } from "@/actions/settings";
import { CompanyLogo } from "@/components/ui/company-logo";

interface LogoSettingsProps {
  logoUrl: string | null;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export default function LogoSettings({ logoUrl }: LogoSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Format non supporté. Utilisez PNG, JPG, WebP ou SVG." });
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage({ type: "error", text: "Fichier trop volumineux (max 2 Mo)." });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        // Upload file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "company-logos");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Erreur lors de l'upload" });
          return;
        }

        // Save URL in settings
        const result = await saveCompanyLogo(data.url);
        if (result.success) {
          setMessage({ type: "success", text: "Logo mis à jour avec succès" });
          router.refresh();
        } else {
          setMessage({ type: "error", text: result.error || "Erreur" });
        }
      } catch {
        setMessage({ type: "error", text: "Erreur lors de l'upload" });
      }
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer le logo ? Le logo par défaut sera utilisé.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteCompanyLogo();
      if (result.success) {
        setMessage({ type: "success", text: "Logo supprimé" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Erreur" });
      }
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--blue-surface)]">
          <ImageIcon className="h-4.5 w-4.5 text-[var(--blue)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--heading)]">
            Logo de la société
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Affiché dans la sidebar, les documents et les exports PDF
          </p>
        </div>
      </div>

      {/* Current logo preview */}
      {logoUrl && (
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-[var(--green)]" />
            <span className="text-xs text-[var(--text)]">Logo actuel :</span>
            <CompanyLogo logoUrl={logoUrl} width={120} height={40} />
          </div>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--red-surface)] hover:text-[var(--red)]"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      )}

      {!logoUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--yellow-border)] bg-[var(--yellow-surface)] px-4 py-3">
          <AlertCircle className="h-4 w-4 text-[var(--yellow)]" />
          <span className="text-xs text-[var(--text)]">
            Aucun logo configuré. Le logo par défaut INNOVTEC est utilisé.
          </span>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-sm)] border-2 border-dashed px-6 py-6 transition-colors ${
          isDragging
            ? "border-[var(--yellow)] bg-[var(--yellow-surface)]"
            : "border-[var(--border-1)] hover:border-[var(--yellow)] hover:bg-[var(--hover)]"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-[var(--yellow)]" />
        ) : (
          <Upload className="h-8 w-8 text-[var(--text-muted)]" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--heading)]">
            {isPending ? "Upload en cours..." : "Glissez votre logo ici"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            PNG, JPG, WebP ou SVG — Max 2 Mo
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-xs ${
            message.type === "success"
              ? "bg-[var(--green-surface)] text-[var(--green)]"
              : "bg-[var(--red-surface)] text-[var(--red)]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
