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

    await upsertExperience({
      ...editing,
      date_end: editing.date_end || null,
    });

    setSaving(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette expérience ?")) return;
    await deleteExperience(id);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--heading)]">
            Expériences professionnelles
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing({ ...emptyForm })}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Form */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--yellow-border)] bg-[var(--yellow-surface)] p-4"
        >
          <div className="mb-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Entreprise"
                value={editing.company}
                onChange={(e) =>
                  setEditing({ ...editing, company: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
              />
              <input
                type="text"
                required
                placeholder="Poste occupé"
                value={editing.job_title}
                onChange={(e) =>
                  setEditing({ ...editing, job_title: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
              />
            </div>
            <input
              type="text"
              placeholder="Lieu (optionnel)"
              value={editing.location}
              onChange={(e) =>
                setEditing({ ...editing, location: e.target.value })
              }
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Date de début
                </label>
                <input
                  type="date"
                  required
                  value={editing.date_start}
                  onChange={(e) =>
                    setEditing({ ...editing, date_start: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Date de fin (vide = en cours)
                </label>
                <input
                  type="date"
                  value={editing.date_end}
                  onChange={(e) =>
                    setEditing({ ...editing, date_end: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
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
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--yellow)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-3 py-1.5 text-xs font-medium text-[var(--navy)] hover:bg-[var(--yellow-hover)] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {experiences.length === 0 && !editing ? (
        <p className="text-xs text-[var(--text-secondary)]">
          Aucune expérience renseignée.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="group flex items-start justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] p-3"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--heading)]">
                  {exp.job_title}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {exp.company}
                  {exp.location && (
                    <span className="inline-flex items-center gap-0.5">
                      {" "}
                      <MapPin className="inline h-3 w-3" /> {exp.location}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]/70">
                  {formatDate(exp.date_start)} —{" "}
                  {exp.date_end ? formatDate(exp.date_end) : "En cours"}
                </div>
                {exp.description && (
                  <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                    {exp.description}
                  </p>
                )}
              </div>
              <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  className="rounded p-1 text-[var(--text-secondary)] hover:bg-gray-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="rounded p-1 text-red-400 hover:bg-red-50"
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
