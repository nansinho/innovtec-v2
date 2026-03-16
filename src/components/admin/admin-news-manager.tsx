"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  X,
  Sparkles,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  createNews,
  togglePublishNews,
  deleteNews,
} from "@/actions/news";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import type { News, NewsCategory, NewsPriority } from "@/lib/types/database";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const categoryLabels: Record<NewsCategory, string> = {
  entreprise: "Entreprise",
  securite: "Sécurité",
  formation: "Formation",
  chantier: "Chantier",
  social: "Social",
  rh: "RH",
};

const categoryVariants: Record<NewsCategory, BadgeVariant> = {
  entreprise: "blue",
  securite: "red",
  formation: "green",
  chantier: "yellow",
  social: "purple",
  rh: "indigo",
};

type NewsItem = News & {
  author?: { first_name: string; last_name: string } | null;
};

interface AdminNewsManagerProps {
  news: NewsItem[];
}

export default function AdminNewsManager({ news: initialNews }: AdminNewsManagerProps) {
  const [news, setNews] = useState(initialNews);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  // AI state
  const [formMode, setFormMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "entreprise" as NewsCategory,
    priority: "normal" as NewsPriority,
    image_url: "",
    is_carousel: false,
    is_published: false,
  });

  const searchLower = search.toLowerCase();
  const filtered = useMemo(
    () =>
      news.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.excerpt.toLowerCase().includes(searchLower)
      ),
    [news, searchLower]
  );

  function handleSubmit() {
    if (!form.title.trim()) return;

    startTransition(async () => {
      const result = await createNews(form);
      if (result.success) {
        setShowForm(false);
        setForm({
          title: "",
          excerpt: "",
          content: "",
          category: "entreprise",
          priority: "normal",
          image_url: "",
          is_carousel: false,
          is_published: false,
        });
        router.refresh();
      }
    });
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "news" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Erreur IA");
        return;
      }

      const result = data.result;
      setForm({
        ...form,
        title: result.title || "",
        excerpt: result.excerpt || "",
        content: result.content || "",
        category: result.category || "entreprise",
        priority: result.priority || "normal",
      });
      setFormMode("manual");
    } catch {
      setAiError("Erreur de connexion au serveur");
    } finally {
      setAiLoading(false);
    }
  }

  function handleTogglePublish(newsId: string, publish: boolean) {
    setLoading(newsId);
    startTransition(async () => {
      await togglePublishNews(newsId, publish);
      setNews((prev) =>
        prev.map((n) =>
          n.id === newsId
            ? {
                ...n,
                is_published: publish,
                published_at: publish ? new Date().toISOString() : null,
              }
            : n
        )
      );
      setLoading(null);
    });
  }

  function handleDelete(newsId: string) {
    if (!confirm("Supprimer cette actualité définitivement ?")) return;
    setLoading(newsId);
    startTransition(async () => {
      await deleteNews(newsId);
      setNews((prev) => prev.filter((n) => n.id !== newsId));
      setLoading(null);
    });
  }

  const allPageSelected = filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        filtered.forEach((n) => next.delete(n.id));
      } else {
        filtered.forEach((n) => next.add(n.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher une actualité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-1)] py-2.5 pl-10 pr-4 text-sm text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)] focus:shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.97]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Annuler" : "Nouvelle actualité"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--heading)]">
              Créer une actualité
            </h3>
            <button
              onClick={() => setFormMode(formMode === "ai" ? "manual" : "ai")}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--navy)] transition-colors hover:text-[var(--navy)]/80"
            >
              {formMode === "ai" ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {formMode === "ai" ? "Mode IA actif" : "Mode manuel"}
            </button>
          </div>

          {/* AI Mode */}
          {formMode === "ai" && (
            <div className="mb-4 space-y-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] p-4">
              <p className="text-[12px] text-[var(--text-secondary)]">
                Décrivez le sujet de l&apos;actualité et l&apos;IA générera le titre, l&apos;extrait, le contenu et suggérera la catégorie.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Nous avons remporté le marché de fibre optique de la ville de Nantes. Le chantier débutera en mars 2026 et durera 8 mois..."
                rows={3}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-[12.5px] text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--navy)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--navy)] shadow-xs transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
                )}
                {aiLoading ? "Génération..." : "Générer l'actualité"}
              </button>
              {aiError && (
                <p className="text-[12px] text-[var(--red)]">{aiError}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Titre *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                placeholder="Titre de l'actualité"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Extrait
              </label>
              <input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                placeholder="Court résumé"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Contenu
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                placeholder="Contenu détaillé de l'actualité"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as NewsCategory })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)]"
                >
                  {(Object.entries(categoryLabels) as [NewsCategory, string][]).map(
                    ([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Priorité
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as NewsPriority,
                    })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)]"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  URL de l&apos;image
                </label>
                <input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.is_carousel}
                  onChange={(e) =>
                    setForm({ ...form, is_carousel: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[var(--border-2)] accent-[var(--yellow)]"
                />
                Afficher dans le carousel
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[var(--border-2)] accent-[var(--yellow)]"
                />
                Publier immédiatement
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim()}
                className="rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm disabled:opacity-50"
              >
                {isPending ? "Création..." : "Créer l'actualité"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-1)] bg-white shadow-sm ring-1 ring-black/[0.03]">
        {/* Batch actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
            <span className="font-medium text-amber-800">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <span className="text-amber-300">—</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-amber-500 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-1)] bg-[var(--hover)]">
            <tr>
              <th className="w-10 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                  aria-label="Sélectionner tout"
                />
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Titre
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Catégorie
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Statut
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Date
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-medium text-[var(--text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)]">
            {filtered.map((article) => {
              const authorName = article.author
                ? `${article.author.first_name} ${article.author.last_name}`
                : "—";

              return (
                <tr
                  key={article.id}
                  className={cn(
                    "transition-colors duration-200",
                    selectedIds.has(article.id) ? "bg-amber-50/50" : "hover:bg-[var(--hover)]"
                  )}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleOne(article.id)}
                      className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <div className="font-medium text-[var(--heading)]">
                        {article.title}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Par {authorName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={categoryVariants[article.category]} dot={false}>
                      {categoryLabels[article.category]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={article.is_published ? "green" : "default"} dot={false}>
                      {article.is_published ? "Publié" : "Brouillon"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--text-muted)]">
                    {article.published_at
                      ? formatDate(article.published_at)
                      : formatDate(article.created_at)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <DropdownMenu
                      items={[
                        {
                          label: article.is_published ? "Dépublier" : "Publier",
                          icon: article.is_published ? EyeOff : Eye,
                          onClick: () => handleTogglePublish(article.id, !article.is_published),
                        },
                        {
                          label: "Supprimer",
                          icon: Trash2,
                          onClick: () => handleDelete(article.id),
                          variant: "danger" as const,
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Aucune actualité trouvée.
          </div>
        )}
      </div>
    </div>
  );
}
