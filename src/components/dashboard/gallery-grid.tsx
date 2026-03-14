import Image from "next/image";
import { ChevronRight, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { getRecentPhotos } from "@/actions/gallery";

export default async function GalleryGrid() {
  const photos = await getRecentPhotos(6);

  return (
    <Card>
      <CardHeader
        title="Galerie photos"
        action={
          <Link
            href="/galerie"
            className="flex items-center gap-1 text-xs font-medium text-[var(--yellow)] transition-opacity hover:opacity-80"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {photos.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <ImageIcon className="mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-[var(--text-muted)]">
            Aucune photo dans la galerie
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-[var(--radius)]"
            >
              <Image
                src={photo.image_url}
                alt={photo.caption || ""}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-105"
              />
              {photo.caption && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs text-white">{photo.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
