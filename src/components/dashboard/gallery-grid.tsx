import Image from "next/image";
import { ChevronRight } from "lucide-react";
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
            className="flex items-center gap-1 text-[10.5px] font-medium text-[var(--yellow)] opacity-85 transition-opacity hover:opacity-100"
          >
            Voir tout <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {photos.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-[var(--text-muted)]">
          Aucune photo dans la galerie
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-[var(--radius-sm)]"
            >
              <Image
                src={photo.image_url}
                alt={photo.caption || ""}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {photo.caption && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[9.5px] text-white">{photo.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
