"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Key, Eye, EyeOff, Trash2, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { saveApiKey, deleteApiKey } from "@/actions/settings";

interface ApiKeySettingsProps {
  hasKey: boolean;
  maskedKey: string;
}

export default function ApiKeySettings({ hasKey, maskedKey }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  function handleSave() {
    if (!apiKey.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveApiKey(apiKey);
      if (result.success) {
        setMessage({ type: "success", text: "Cle API sauvegardee avec succes" });
        setApiKey("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Erreur" });
      }
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer la cle API ? Les fonctions IA ne seront plus disponibles.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteApiKey();
      if (result.success) {
        setMessage({ type: "success", text: "Cle API supprimee" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Erreur" });
      }
    });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--purple-surface)]">
          <Key className="h-4.5 w-4.5 text-[var(--purple)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--heading)]">
            Connecteur API Claude
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Clef API Anthropic pour l&apos;import PDF et la generation IA
          </p>
        </div>
      </div>

      {/* Current status */}
      {hasKey && (
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--green)]" />
            <span className="text-xs text-[var(--text)]">Cle active :</span>
            <code className="rounded bg-[var(--bg)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
              {maskedKey}
            </code>
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

      {!hasKey && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--yellow-border)] bg-[var(--yellow-surface)] px-4 py-3">
          <AlertCircle className="h-4 w-4 text-[var(--yellow)]" />
          <span className="text-xs text-[var(--text)]">
            Aucune cle API configuree. Les fonctions d&apos;import PDF et de generation IA ne sont pas disponibles.
          </span>
        </div>
      )}

      {/* Input */}
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[var(--text-secondary)]">
          {hasKey ? "Remplacer la cle API" : "Cle API Anthropic"}
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] py-2.5 pl-4 pr-10 font-mono text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] text-[var(--text-muted)]">
            Obtenez votre cle sur{" "}
            <span className="font-medium text-[var(--purple)]">
              console.anthropic.com
            </span>
          </p>
          <button
            onClick={handleSave}
            disabled={isPending || !apiKey.trim()}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
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
