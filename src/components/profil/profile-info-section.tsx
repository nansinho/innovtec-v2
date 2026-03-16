"use client";

import { useState } from "react";
import { User, Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import type { Profile } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
  collaborateur: "Collaborateur",
};

const jobTitles = [
  "Technicien fibre optique",
  "Technicien réseau",
  "Technicien télécom",
  "Technicien courant faible",
  "Technicien courant fort",
  "Technicien de maintenance",
  "Technicien d'installation",
  "Technicien polyvalent",
  "Chef d'équipe",
  "Chef de chantier",
  "Conducteur de travaux",
  "Responsable technique",
  "Responsable QSE",
  "Responsable RH",
  "Chargé d'affaires",
  "Chargé d'études",
  "Dessinateur / Projeteur",
  "Ingénieur réseau",
  "Ingénieur télécom",
  "Assistant(e) administratif(ve)",
  "Assistant(e) de direction",
  "Comptable",
  "Responsable administratif",
  "Commercial",
  "Directeur technique",
  "Directeur général",
  "Magasinier",
  "Logisticien",
  "Chauffeur / Livreur",
  "Apprenti / Alternant",
  "Stagiaire",
];

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
    gender: profile.gender || ("" as "" | "M" | "F"),
    date_of_birth: profile.date_of_birth || "",
    hire_date: profile.hire_date || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile(form);

    if (result.success) {
      toast.success("Profil mis à jour");
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
          <User className="h-[18px] w-[18px] text-orange-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">
          Informations personnelles
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Prénom
            </label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Nom
            </label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Rôle
            </label>
            <input
              type="text"
              disabled
              value={roleLabels[profile.role] ?? profile.role}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Poste / Métier
            </label>
            <select
              value={
                form.job_title && !jobTitles.includes(form.job_title)
                  ? "__custom__"
                  : form.job_title
              }
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setForm({ ...form, job_title: "" });
                } else {
                  setForm({ ...form, job_title: e.target.value });
                }
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">-- Sélectionner un poste --</option>
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
              <option value="__custom__">Autre (saisie libre)</option>
            </select>
            {form.job_title !== "" &&
              !jobTitles.includes(form.job_title) && (
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) =>
                    setForm({ ...form, job_title: e.target.value })
                  }
                  placeholder="Saisissez votre poste"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Téléphone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="06 12 34 56 78"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Genre
            </label>
            <select
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as "" | "M" | "F" })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">-- Non renseigné --</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Date de naissance
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm({ ...form, date_of_birth: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Date d&apos;entrée dans l&apos;entreprise
            </label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) =>
                setForm({ ...form, hire_date: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-orange-700 hover:shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
