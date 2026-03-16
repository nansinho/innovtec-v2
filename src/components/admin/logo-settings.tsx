"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload, Trash2, Loader2, CheckCircle, AlertCircle, Sun, Moon } from "lucide-react";
import { saveCompanyLogo, deleteCompanyLogo } from "@/actions/settings";
import type { CompanyLogos } from "@/actions/settings";

interface LogoSettingsProps {
  logos: CompanyLogos;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

function LogoUploadZone({
  variant,
  currentUrl,
  label,
  description,
  icon: Icon,
  bgClass,
  previewBg,
}: {
  variant: "light" | "dark";
  currentUrl: string | null;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  previewBg: string;
}) {
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "company-logos");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Erreur lors de l'upload" });
          return;
        }

        const result = await saveCompanyLogo(data.url, variant);
        if (result.success) {
          setMessage({ type: "success", text: "Logo mis à jour" });
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
    if (!confirm("Supprimer ce logo ?")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteCompanyLogo(variant);
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
    <div className="flex-1 space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <div>
          <p className="text-xs font-semibold text-gray-900">{label}</p>
          <p className="text-[10px] text-gray-400">{description}</p>
        </div>
      </div>

      {/* Preview */}
      {currentUrl && (
        <div className={`flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 ${previewBg}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={label}
            className="h-10 max-w-[140px] object-contain"
          />
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`${bgClass} flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 transition-colors ${
          isDragging
            ? "border-orange-500 bg-orange-50"
            : "border-gray-200 hover:border-orange-500 hover:bg-gray-50"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        ) : (
          <Upload className="h-6 w-6 text-gray-400" />
        )}
        <p className="text-[11px] font-medium text-gray-900">
          {isPending ? "Upload..." : currentUrl ? "Remplacer" : "Glissez ici"}
        </p>
        <p className="text-[9px] text-gray-400">
          PNG, JPG, WebP, SVG
        </p>
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
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function LogoSettings({ logos }: LogoSettingsProps) {
  const hasAny = logos.light || logos.dark;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
          <ImageIcon className="h-4.5 w-4.5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Logo de la société
          </h3>
          <p className="text-[11px] text-gray-400">
            Deux variantes pour un affichage optimal sur tous les fonds
          </p>
        </div>
      </div>

      {!hasAny && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-500 bg-orange-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-xs text-gray-700">
            Aucun logo configuré. Le logo par défaut INNOVTEC est utilisé.
          </span>
        </div>
      )}

      {/* Two upload zones side by side */}
      <div className="flex gap-4">
        <LogoUploadZone
          variant="light"
          currentUrl={logos.light}
          label="Fond clair"
          description="Documents, tableaux SSE, exports PDF"
          icon={Sun}
          bgClass=""
          previewBg="bg-white"
        />
        <LogoUploadZone
          variant="dark"
          currentUrl={logos.dark}
          label="Fond sombre"
          description="Sidebar, page de connexion"
          icon={Moon}
          bgClass=""
          previewBg="bg-[#0F2035]"
        />
      </div>
    </div>
  );
}
