"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { createFeedPost } from "@/actions/feed";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "news-images");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Erreur lors de l'envoi de l'image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleSubmit() {
    if (!content.trim() || isPending) return;
    setError("");

    startTransition(async () => {
      const result = await createFeedPost(content.trim(), imageUrl || undefined);
      if (result.success) {
        setContent("");
        setImageUrl("");
        router.refresh();
      } else {
        setError(result.error ?? "Erreur lors de la publication. Réessayez.");
      }
    });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-4 shadow-xs">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Quoi de neuf ? Partagez avec vos collègues..."
        rows={3}
        className="w-full resize-none rounded-xl bg-zinc-50 px-4 py-3 text-sm text-[var(--heading)] outline-none placeholder:text-zinc-400 focus:bg-zinc-100/80"
      />

      {imageUrl && (
        <div className="relative mt-3 h-40 overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt="Image jointe"
            fill
            className="object-cover"
          />
          <button
            onClick={() => setImageUrl("")}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Envoi..." : "Photo"}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
          className="flex items-center gap-1.5 rounded-full bg-[var(--yellow)] px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-[var(--yellow-hover)] disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {isPending ? "Publication..." : "Publier"}
        </button>
      </div>
    </div>
  );
}
