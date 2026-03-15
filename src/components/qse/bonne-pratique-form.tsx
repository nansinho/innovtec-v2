"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, X, Upload } from "lucide-react";
import Link from "next/link";
import { createBonnePratique, uploadBonnePratiquePhoto } from "@/actions/bonnes-pratiques";
import { toast } from "sonner";

const PILLARS = [
  { key: "qualite", label: "Qualité" },
  { key: "sante", label: "Santé" },
  { key: "securite", label: "Sécurité" },
  { key: "environnement", label: "Environnement" },
];

export default function BonnePratiqueForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    pillar: "securite",
    category: "",
    description: "",
    chantier: "",
    photos: [] as string[],
  });

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.photos.length + files.length > 5) {
      toast.error("Maximum 5 photos autorisées");
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadBonnePratiquePhoto(fd);
      if (result.error) {
        toast.error(`Erreur upload: ${result.error}`);
      } else if (result.filePath) {
        newPhotos.push(result.filePath);
      }
    }

    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
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
      const result = await createBonnePratique(form);
      if (result.success) {
        toast.success("Bonne pratique enregistrée");
        router.push("/qse/bonnes-pratiques");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/qse/bonnes-pratiques"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux bonnes pratiques
      </Link>

      <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-[var(--heading)]">
          Nouvelle bonne pratique
        </h2>

        <div className="space-y-5">
          {/* Titre */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Titre *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--green)]"
              placeholder="Titre de la bonne pratique"
            />
          </div>

          {/* Pilier + Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Pilier QSE *
              </label>
              <select
                value={form.pillar}
                onChange={(e) => setForm({ ...form, pillar: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--green)]"
              >
                {PILLARS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Catégorie
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--green)]"
                placeholder="Ex: EPI, signalisation..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--green)]"
              placeholder="Décrivez en détail la bonne pratique, son contexte et ses bénéfices..."
            />
          </div>

          {/* Chantier */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Chantier
            </label>
            <input
              value={form.chantier}
              onChange={(e) => setForm({ ...form, chantier: e.target.value })}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none focus:border-[var(--green)]"
              placeholder="Nom du chantier concerné"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Photos ({form.photos.length}/5)
            </label>

            {form.photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {form.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="group relative flex h-9 items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--green-surface)] px-3 text-xs text-[var(--green)]"
                  >
                    <span className="max-w-[150px] truncate">
                      {photo.split("/").pop()}
                    </span>
                    <button
                      onClick={() => removePhoto(i)}
                      className="text-[var(--text-muted)] transition-colors hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.photos.length < 5 && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-xs)] border border-dashed border-[var(--border-1)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--green)] hover:text-[var(--green)]">
                <Upload className="h-4 w-4" />
                {uploading ? "Envoi en cours..." : "Ajouter des photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end border-t border-[var(--border-1)] pt-5">
            <button
              onClick={handleSubmit}
              disabled={isPending || uploading}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--green)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
