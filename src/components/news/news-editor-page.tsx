"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Send,
  Loader2,
  Paperclip,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import RichTextEditor from "./rich-text-editor";
import NewsAttachmentsManager from "./news-attachments";
import {
  createNews,
  updateNews,
  addNewsAttachment,
  deleteNewsAttachment,
} from "@/actions/news";
import type { News, NewsCategory, NewsPriority, NewsAttachment } from "@/lib/types/database";

const categoryLabels: Record<NewsCategory, string> = {
  entreprise: "Entreprise",
  securite: "Sécurité",
  formation: "Formation",
  chantier: "Chantier",
  social: "Social",
  rh: "RH",
};

const priorityLabels: Record<NewsPriority, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

interface NewsEditorPageProps {
  mode: "create" | "edit";
  article?: News & {
    author?: { first_name: string; last_name: string } | null;
  };
  existingAttachments?: NewsAttachment[];
}

export default function NewsEditorPage({
  mode,
  article,
  existingAttachments = [],
}: NewsEditorPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(article?.title || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [category, setCategory] = useState<NewsCategory>(
    article?.category || "entreprise"
  );
  const [priority, setPriority] = useState<NewsPriority>(
    article?.priority || "normal"
  );
  const [imageUrl, setImageUrl] = useState(article?.image_url || "");
  const [isCarousel, setIsCarousel] = useState(article?.is_carousel || false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attachments, setAttachments] =
    useState<NewsAttachment[]>(existingAttachments);
  const [tempAttachments, setTempAttachments] = useState<
    { file_name: string; file_url: string; file_size: number; file_type: string; id: string }[]
  >([]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "news-images");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setImageUrl(data.url);
        } else {
          toast.error(data.error || "Erreur lors de l'upload");
        }
      } catch {
        toast.error("Erreur lors de l'upload");
      }
      setUploadingImage(false);
    },
    []
  );

  const handleAddTempAttachment = useCallback(
    (att: {
      file_name: string;
      file_url: string;
      file_size: number;
      file_type: string;
    }) => {
      setTempAttachments((prev) => [
        ...prev,
        { ...att, id: `temp-${Date.now()}-${Math.random()}` },
      ]);
    },
    []
  );

  const handleRemoveTempAttachment = useCallback((id: string) => {
    setTempAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleRemoveExistingAttachment = useCallback(
    (id: string) => {
      if (!article) return;
      startTransition(async () => {
        await deleteNewsAttachment(id, article.id);
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      });
    },
    [article]
  );

  const handleSubmit = (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    startTransition(async () => {
      const formData = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        category,
        priority,
        image_url: imageUrl,
        is_carousel: isCarousel,
        is_published: publish,
      };

      let newsId: string | undefined;

      if (mode === "create") {
        const result = await createNews(formData);
        if (!result.success) {
          toast.error(result.error || "Erreur lors de la création");
          return;
        }
        newsId = result.id;
      } else if (article) {
        const result = await updateNews(article.id, formData);
        if (!result.success) {
          toast.error(result.error || "Erreur lors de la mise à jour");
          return;
        }
        newsId = article.id;
      }

      // Save temp attachments
      if (newsId && tempAttachments.length > 0) {
        for (const att of tempAttachments) {
          await addNewsAttachment(newsId, {
            file_name: att.file_name,
            file_url: att.file_url,
            file_size: att.file_size,
            file_type: att.file_type,
          });
        }
      }

      toast.success(
        publish
          ? "Article publié avec succès !"
          : "Brouillon enregistré avec succès !"
      );
      router.push("/actualites");
    });
  };

  const allAttachments = [
    ...attachments,
    ...tempAttachments.map((a) => ({
      ...a,
      news_id: article?.id || "",
      uploaded_by: null,
      created_at: new Date().toISOString(),
    })),
  ] as NewsAttachment[];

  return (
    <div className="min-h-screen px-7 py-6 pb-20 md:pb-7">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/actualites"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux actualités
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-2 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Sauvegarder brouillon
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Publier
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-xl font-bold text-[var(--heading)]">
          {mode === "create" ? "Créer un article" : "Modifier l'article"}
        </h1>

        {/* Cover image */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-medium text-[var(--heading)]">
            <ImageIcon className="mr-1.5 inline h-3.5 w-3.5" />
            Image de couverture
          </label>
          {imageUrl ? (
            <div className="relative aspect-[16/7] overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)]">
              <Image
                src={imageUrl}
                alt="Couverture"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
              <button
                onClick={() => setImageUrl("")}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--border-1)] py-12 transition-colors hover:border-[var(--yellow)] hover:bg-[var(--yellow-surface)]"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(file);
                };
                input.click();
              }}
            >
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-[var(--yellow)]" />
              ) : (
                <Upload className="h-8 w-8 text-[var(--text-muted)]" />
              )}
              <p className="text-[12.5px] text-[var(--text-secondary)]">
                Cliquez ou glissez une image de couverture
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'article"
            className="w-full border-0 bg-transparent text-2xl font-bold text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Excerpt */}
        <div className="mb-6">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Résumé / chapeau de l'article (optionnel)"
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-[14px] leading-relaxed text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <div className="h-px bg-[var(--border-1)]" />
        </div>

        {/* Rich text editor */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-medium text-[var(--heading)]">
            Contenu de l'article
          </label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        {/* Settings row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--heading)]">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--heading)]">
              Priorité
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NewsPriority)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2 text-[12.5px] text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            >
              {Object.entries(priorityLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--heading)]">
              <input
                type="checkbox"
                checked={isCarousel}
                onChange={(e) => setIsCarousel(e.target.checked)}
                className="rounded border-[var(--border-1)] accent-[var(--yellow)]"
              />
              Afficher dans le carousel
            </label>
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-medium text-[var(--heading)]">
            <Paperclip className="mr-1.5 inline h-3.5 w-3.5" />
            Pièces jointes
          </label>
          <NewsAttachmentsManager
            attachments={allAttachments}
            onAdd={handleAddTempAttachment}
            onRemove={(id) => {
              if (id.startsWith("temp-")) {
                handleRemoveTempAttachment(id);
              } else {
                handleRemoveExistingAttachment(id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
