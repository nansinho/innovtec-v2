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
        icon={ImageIcon}
        action={
          <Link
            href="/galerie"
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {photos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <ImageIcon className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Aucune photo dans la galerie
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl"
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
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">{photo.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
