"use client";

import { useState } from "react";
import { Award, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import {
  upsertUserFormation,
  deleteUserFormation,
} from "@/actions/profile";
import type { UserFormation } from "@/lib/types/database";

interface FormationForm {
  id?: string;
  title: string;
  organisme: string;
  date_obtained: string;
  expiry_date: string;
  description: string;
}

const emptyForm: FormationForm = {
  title: "",
  organisme: "",
  date_obtained: "",
  expiry_date: "",
  description: "",
};

export default function FormationsSection({
  formations,
}: {
  formations: UserFormation[];
}) {
  const [editing, setEditing] = useState<FormationForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    await upsertUserFormation({
      ...editing,
      date_obtained: editing.date_obtained || null,
      expiry_date: editing.expiry_date || null,
    });

    setSaving(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette formation ?")) return;
    await deleteUserFormation(id);
  }

  function isExpired(expiryDate: string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
            <Award className="h-4 w-4 text-green-500" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--heading)]">
            Formations & Certifications
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
          className="mb-4 rounded-[var(--radius-sm)] border border-green-100 bg-green-50/30 p-4"
        >
          <div className="mb-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Intitulé de la formation"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-green-400"
              />
              <input
                type="text"
                placeholder="Organisme"
                value={editing.organisme}
                onChange={(e) =>
                  setEditing({ ...editing, organisme: e.target.value })
                }
                className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-green-400"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Date d&apos;obtention
                </label>
                <input
                  type="date"
                  value={editing.date_obtained}
                  onChange={(e) =>
                    setEditing({ ...editing, date_obtained: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Date d&apos;expiration (optionnel)
                </label>
                <input
                  type="date"
                  value={editing.expiry_date}
                  onChange={(e) =>
                    setEditing({ ...editing, expiry_date: e.target.value })
                  }
                  className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-green-400"
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
              className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2 text-sm outline-none focus:border-green-400"
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
      {formations.length === 0 && !editing ? (
        <p className="text-xs text-[var(--text-secondary)]">
          Aucune formation renseignée.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {formations.map((f) => (
            <div
              key={f.id}
              className="group flex items-start justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--heading)]">
                    {f.title}
                  </span>
                  {f.expiry_date && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isExpired(f.expiry_date)
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {isExpired(f.expiry_date) ? "Expirée" : "Valide"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {f.organisme && `${f.organisme} — `}
                  {f.date_obtained &&
                    new Date(f.date_obtained).toLocaleDateString("fr-FR")}
                  {f.expiry_date &&
                    ` → ${new Date(f.expiry_date).toLocaleDateString("fr-FR")}`}
                </div>
                {f.description && (
                  <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                    {f.description}
                  </p>
                )}
              </div>
              <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() =>
                    setEditing({
                      id: f.id,
                      title: f.title,
                      organisme: f.organisme,
                      date_obtained: f.date_obtained || "",
                      expiry_date: f.expiry_date || "",
                      description: f.description,
                    })
                  }
                  className="rounded p-1 text-[var(--text-secondary)] hover:bg-gray-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
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
