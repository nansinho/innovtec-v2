"use client";

import { useState } from "react";
import { Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { updateEmergencyContact } from "@/actions/profile";

interface EmergencyContactForm {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
}

const relationOptions = [
  "Conjoint(e)",
  "Parent",
  "Frère/Sœur",
  "Enfant",
  "Autre",
];

export default function EmergencyContactSection({
  initialData,
  userId,
}: {
  initialData: EmergencyContactForm;
  userId?: string;
}) {
  const [form, setForm] = useState<EmergencyContactForm>(initialData);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateEmergencyContact(form, userId);
    if (result.success) {
      toast.success("Contact d'urgence mis à jour");
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
          <Phone className="h-[18px] w-[18px] text-red-500" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--heading)]">
          Contact d&apos;urgence
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nom du contact"
            value={form.emergency_contact_name}
            onChange={(e) =>
              setForm({ ...form, emergency_contact_name: e.target.value })
            }
            className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            value={form.emergency_contact_phone}
            onChange={(e) =>
              setForm({ ...form, emergency_contact_phone: e.target.value })
            }
            className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
          />
        </div>
        <select
          value={form.emergency_contact_relation}
          onChange={(e) =>
            setForm({ ...form, emergency_contact_relation: e.target.value })
          }
          className="rounded-[var(--radius-xs)] border border-[var(--border-1)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
        >
          <option value="">Lien de parenté</option>
          {relationOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-xs font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
