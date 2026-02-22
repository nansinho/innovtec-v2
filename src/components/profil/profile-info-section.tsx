"use client";

import { useState } from "react";
import { User, Save } from "lucide-react";
import { updateProfile } from "@/actions/profile";
import type { Profile } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
};

export default function ProfileInfoSection({
  profile,
}: {
  profile: Profile;
}) {
  const [form, setForm] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    job_title: profile.job_title || "",
    phone: profile.phone || "",
    date_of_birth: profile.date_of_birth || "",
    hire_date: profile.hire_date || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateProfile(form);

    if (result.success) {
      setMessage({ type: "success", text: "Profil mis à jour" });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Erreur lors de la mise à jour",
      });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--yellow-surface)]">
          <User className="h-4 w-4 text-[var(--yellow)]" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--heading)]">
          Informations personnelles
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Prénom
            </label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Nom
            </label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-secondary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Rôle
            </label>
            <input
              type="text"
              disabled
              value={roleLabels[profile.role] ?? profile.role}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-secondary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Poste
            </label>
            <input
              type="text"
              value={form.job_title}
              onChange={(e) =>
                setForm({ ...form, job_title: e.target.value })
              }
              placeholder="Ex: Technicien fibre optique"
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Téléphone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="06 12 34 56 78"
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Date de naissance
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm({ ...form, date_of_birth: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Date d&apos;entrée dans l&apos;entreprise
            </label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) =>
                setForm({ ...form, hire_date: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-xs font-medium text-[var(--navy)] transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {message && (
            <span
              className={`text-xs ${
                message.type === "success"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
