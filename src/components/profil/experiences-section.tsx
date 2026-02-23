"use client";

import { useState } from "react";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { upsertExperience, deleteExperience } from "@/actions/profile";
import type { UserExperience } from "@/lib/types/database";

interface ExperienceForm {
  id?: string;
  company: string;
  job_title: string;
  location: string;
  date_start: string;
  date_end: string;
  description: string;
}

const emptyForm: ExperienceForm = {
  company: "",
  job_title: "",
  location: "",
  date_start: "",
  date_end: "",
  description: "",
};

export default function ExperiencesSection({
  experiences,
}: {
  experiences: UserExperience[];
}) {
  const [editing, setEditing] = useState<ExperienceForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const result = await upsertExperience({
      ...editing,
      date_end: editing.date_end || null,
    });

    if (result.success) {
      toast.success(editing.id ? "Expérience mise à jour" : "Expérience ajoutée");
      setEditing(null);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette expérience ?")) return;
    const result = await deleteExperience(id);
    if (result.success) {
      toast.success("Expérience supprimée");
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Briefcase className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--heading)]">
            Expériences professionnelles
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
                placeholder="Entreprise"
                value={editing.company}
                onChange={(e) =>
                  setEditing({ ...editing, company: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
              <input
                type="text"
                required
                placeholder="Poste occupé"
                value={editing.job_title}
                onChange={(e) =>
                  setEditing({ ...editing, job_title: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
            <input
              type="text"
              placeholder="Lieu (optionnel)"
              value={editing.location}
              onChange={(e) =>
                setEditing({ ...editing, location: e.target.value })
              }
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Date de début
                </label>
                <input
                  type="date"
                  required
                  value={editing.date_start}
                  onChange={(e) =>
                    setEditing({ ...editing, date_start: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Date de fin (vide = en cours)
                </label>
                <input
                  type="date"
                  value={editing.date_end}
                  onChange={(e) =>
                    setEditing({ ...editing, date_end: e.target.value })
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

      {experiences.length === 0 && !editing ? (
        <p className="py-4 text-center text-xs text-[var(--text-secondary)]">
          Aucune expérience renseignée.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="group flex items-start justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-4 shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--heading)]">
                  {exp.job_title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {exp.company}
                  {exp.location && (
                    <span className="inline-flex items-center gap-0.5">
                      {" "}
                      <MapPin className="inline h-3 w-3" /> {exp.location}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {formatDate(exp.date_start)} —{" "}
                  {exp.date_end ? formatDate(exp.date_end) : "En cours"}
                </div>
                {exp.description && (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {exp.description}
                  </p>
                )}
              </div>
              <div className="ml-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={() =>
                    setEditing({
                      id: exp.id,
                      company: exp.company,
                      job_title: exp.job_title,
                      location: exp.location,
                      date_start: exp.date_start,
                      date_end: exp.date_end || "",
                      description: exp.description,
                    })
                  }
                  className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--hover)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
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
