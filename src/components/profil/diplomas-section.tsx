"use client";

import { useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { upsertDiploma, deleteDiploma } from "@/actions/profile";
import type { UserDiploma } from "@/lib/types/database";

interface DiplomaForm {
  id?: string;
  title: string;
  school: string;
  year_obtained: string;
  description: string;
}

const emptyForm: DiplomaForm = {
  title: "",
  school: "",
  year_obtained: "",
  description: "",
};

export default function DiplomasSection({
  diplomas,
}: {
  diplomas: UserDiploma[];
}) {
  const [editing, setEditing] = useState<DiplomaForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const result = await upsertDiploma({
      ...editing,
      year_obtained: editing.year_obtained
        ? parseInt(editing.year_obtained)
        : null,
    });

    if (result.success) {
      toast.success(editing.id ? "Diplôme mis à jour" : "Diplôme ajouté");
      setEditing(null);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce diplôme ?")) return;
    const result = await deleteDiploma(id);
    if (result.success) {
      toast.success("Diplôme supprimé");
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
            <GraduationCap className="h-[18px] w-[18px] text-purple-600" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--heading)]">
            Diplômes
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing({ ...emptyForm })}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] p-5"
        >
          <div className="mb-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Intitulé du diplôme"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
              <input
                type="text"
                required
                placeholder="Établissement"
                value={editing.school}
                onChange={(e) =>
                  setEditing({ ...editing, school: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Année d&apos;obtention
                </label>
                <input
                  type="number"
                  min="1950"
                  max="2099"
                  placeholder="2020"
                  value={editing.year_obtained}
                  onChange={(e) =>
                    setEditing({ ...editing, year_obtained: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
            </div>
            <textarea
              placeholder="Description (optionnel)"
              rows={2}
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-white px-4 py-2 text-xs text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)]"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          </div>
        </form>
      )}

      {diplomas.length === 0 && !editing ? (
        <p className="py-4 text-center text-xs text-[var(--text-secondary)]">
          Aucun diplôme renseigné.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {diplomas.map((d) => (
            <div
              key={d.id}
              className="group flex items-start justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-4 shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--heading)]">
                  {d.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {d.school}
                  {d.year_obtained && ` — ${d.year_obtained}`}
                </div>
                {d.description && (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {d.description}
                  </p>
                )}
              </div>
              <div className="ml-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={() =>
                    setEditing({
                      id: d.id,
                      title: d.title,
                      school: d.school,
                      year_obtained: d.year_obtained?.toString() || "",
                      description: d.description,
                    })
                  }
                  className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--hover)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--red-surface)] hover:text-[var(--red)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
