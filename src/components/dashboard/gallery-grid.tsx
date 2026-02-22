import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    caption: "Chantier Voltaire",
  },
  {
    src: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80",
    caption: "Sécurité terrain",
  },
  {
    src: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80",
    caption: "Équipe terrain",
  },
];

export default function GalleryGrid() {
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
      <div className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.caption}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-[var(--radius-sm)]"
          >
            <Image
              src={photo.src}
              alt={photo.caption}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-[9.5px] text-white">{photo.caption}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
