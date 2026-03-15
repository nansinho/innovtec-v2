"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { createRex } from "@/actions/qse";
import { toast } from "sonner";
import AiGenerateButton from "@/components/ai/ai-generate-button";

export default function RexForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"ai" | "manual">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    description: "",
    lessons_learned: "",
    chantier: "",
  });

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "rex" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur IA");
        return;
      }

      const result = data.result;
      setForm({
        title: result.title || "",
        description: result.description || "",
        lessons_learned: result.lessons_learned || "",
        chantier: result.chantier || "",
      });
      setMode("manual");
      toast.success("REX généré par l'IA");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La description est obligatoire");
      return;
    }

    startTransition(async () => {
      const result = await createRex(form);
      if (result.success) {
        toast.success("Retour d'expérience enregistré");
        router.push("/qse/rex");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    });
  }

  return (
    <div>
      <Link
        href="/qse/rex"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux REX
      </Link>

      <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            Nouveau retour d&apos;expérience
          </h2>
          <button
            onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-purple-600 transition-colors hover:text-purple-700"
          >
            {mode === "ai" ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {mode === "ai" ? "Mode IA actif" : "Mode manuel"}
          </button>
        </div>

        {mode === "ai" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Décrivez le contexte
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Lors du chantier de pose fibre à Lyon, nous avons rencontré un problème de coordination avec le sous-traitant qui a causé 2 jours de retard..."
                rows={5}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple-400"
              />
            </div>
            <AiGenerateButton
              onClick={handleAiGenerate}
              loading={aiLoading}
              disabled={!aiPrompt.trim()}
              label="Générer le REX"
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Titre *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                  placeholder="Titre du REX"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Chantier
                </label>
                <input
                  value={form.chantier}
                  onChange={(e) => setForm({ ...form, chantier: e.target.value })}
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                  placeholder="Nom du chantier"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Contexte et déroulement de la situation..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Leçons tirées
              </label>
              <textarea
                value={form.lessons_learned}
                onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                placeholder="Points d'amélioration et leçons retenues..."
              />
            </div>

            <div className="flex justify-end border-t border-[var(--border-1)] pt-5">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
