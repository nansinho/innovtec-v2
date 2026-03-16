"use client";

import { useState } from "react";
import { Award, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
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
  userId,
}: {
  formations: UserFormation[];
  userId?: string;
}) {
  const [editing, setEditing] = useState<FormationForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const result = await upsertUserFormation({
      ...editing,
      date_obtained: editing.date_obtained || null,
      expiry_date: editing.expiry_date || null,
    }, userId);

    if (result.success) {
      toast.success(editing.id ? "Formation mise à jour" : "Formation ajoutée");
      setEditing(null);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette formation ?")) return;
    const result = await deleteUserFormation(id, userId);
    if (result.success) {
      toast.success("Formation supprimée");
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }

  function isExpired(expiryDate: string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
            <Award className="h-[18px] w-[18px] text-green-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">
            Formations & Certifications
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing({ ...emptyForm })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-500 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-5"
        >
          <div className="mb-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Intitulé de la formation"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Organisme"
                value={editing.organisme}
                onChange={(e) =>
                  setEditing({ ...editing, organisme: e.target.value })
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Date d&apos;obtention
                </label>
                <input
                  type="date"
                  value={editing.date_obtained}
                  onChange={(e) =>
                    setEditing({ ...editing, date_obtained: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Date d&apos;expiration (optionnel)
                </label>
                <input
                  type="date"
                  value={editing.expiry_date}
                  onChange={(e) =>
                    setEditing({ ...editing, expiry_date: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-orange-700 hover:shadow-sm disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500 shadow-sm transition-all duration-200 hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          </div>
        </form>
      )}

      {formations.length === 0 && !editing ? (
        <p className="py-4 text-center text-xs text-gray-500">
          Aucune formation renseignée.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {formations.map((f) => (
            <div
              key={f.id}
              className="group flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {f.title}
                  </span>
                  {f.expiry_date && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isExpired(f.expiry_date)
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {isExpired(f.expiry_date) ? "Expirée" : "Valide"}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {f.organisme && `${f.organisme} — `}
                  {f.date_obtained &&
                    new Date(f.date_obtained).toLocaleDateString("fr-FR")}
                  {f.expiry_date &&
                    ` → ${new Date(f.expiry_date).toLocaleDateString("fr-FR")}`}
                </div>
                {f.description && (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {f.description}
                  </p>
                )}
              </div>
              <div className="ml-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
                  className="rounded-lg p-1.5 text-gray-500 transition-colors duration-200 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
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
