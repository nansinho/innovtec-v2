"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { News } from "@/lib/types/database";
import { getCarouselNews } from "@/actions/news";

interface Slide {
  id: string | null;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  cta: string;
  image: string;
  gradient: string;
}

const fallbackSlides: Slide[] = [
  {
    id: null,
    badge: "Bienvenue",
    badgeColor: "bg-white/10 text-white/90",
    title: "Bienvenue sur l'intranet INNOVTEC Réseaux",
    description: "Retrouvez toutes les informations de l'entreprise, les actualités et vos outils au quotidien.",
    cta: "Découvrir",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    gradient: "from-[#1E3A5F] via-[#1a3355] to-[#0F2035]",
  },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

const categoryGradients: Record<string, string> = {
  securite: "from-[#1a2e44] via-[#1E3A5F] to-[#2a4a6b]",
  entreprise: "from-[#1E3A5F] via-[#1a3355] to-[#0F2035]",
  formation: "from-[#0F2035] via-[#1a3350] to-[#1e4d5e]",
  chantier: "from-[#0F2035] via-[#1a3355] to-[#2a4570]",
  social: "from-[#1a2440] via-[#252050] to-[#1E3A5F]",
  rh: "from-[#2a1a30] via-[#1E3A5F] to-[#1a2e44]",
};

const categoryBadgeColors: Record<string, string> = {
  securite: "bg-amber-500/20 text-amber-200",
  entreprise: "bg-white/10 text-white/90",
  formation: "bg-emerald-500/20 text-emerald-200",
  chantier: "bg-blue-500/20 text-blue-200",
  social: "bg-violet-500/20 text-violet-200",
  rh: "bg-pink-500/20 text-pink-200",
};

function newsToSlide(news: News): Slide {
  const badge = news.priority === "urgent"
    ? `Urgent · ${news.category}`
    : news.category.charAt(0).toUpperCase() + news.category.slice(1);

  const rawDescription = news.excerpt || news.content.slice(0, 120);

  return {
    id: news.id,
    badge,
    badgeColor: categoryBadgeColors[news.category] ?? categoryBadgeColors.entreprise,
    title: news.title,
    description: stripHtml(rawDescription),
    cta: "Lire la suite",
    image: news.image_url || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    gradient: categoryGradients[news.category] ?? categoryGradients.entreprise,
  };
}

export default function WelcomeCarousel() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  useEffect(() => {
    getCarouselNews().then((news) => {
      if (news.length > 0) {
        setSlides(news.map((n) => newsToSlide(n as News)));
      }
    });
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Autoplay
  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(timer);
  }, [emblaApi, slides.length]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0F2035] shadow-lg ring-1 ring-black/5">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => {
            const inner = (
              <div className={`flex h-[220px] sm:h-[260px] w-full bg-gradient-to-br ${slide.gradient}`}>
                <div className="z-[2] flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 sm:py-8">
                  <span className={`mb-2 sm:mb-3 inline-block w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[1.5px] backdrop-blur-sm ${slide.badgeColor}`}>
                    {slide.badge}
                  </span>
                  <h2 className="mb-1.5 sm:mb-2 text-lg sm:text-[22px] font-bold leading-snug tracking-tight text-white line-clamp-2">
                    {slide.title}
                  </h2>
                  <p className="hidden sm:block max-w-[420px] text-[14px] leading-relaxed text-white/60 line-clamp-2">
                    {slide.description}
                  </p>
                  <span className="mt-3 sm:mt-5 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/80 transition-all duration-200 group-hover:text-white group-hover:gap-3">
                    {slide.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative hidden w-[42%] shrink-0 overflow-hidden sm:block">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 0vw, 38vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/5 to-black/50" />
                </div>
              </div>
            );

            return (
              <div key={i} className="min-w-0 flex-[0_0_100%]">
                {slide.id ? (
                  <Link href={`/actualites/${slide.id}`} className="group block h-full" draggable={false}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Counter */}
          <div className="absolute right-4 top-3 z-[5] rounded-full bg-black/25 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white/70 backdrop-blur-sm">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>

          {/* Arrows — hidden on mobile, swipe replaces them */}
          <div className="absolute bottom-3 right-4 z-[5] hidden gap-1.5 sm:flex">
            <button
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
              aria-label="Suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-6 z-[5] flex gap-1.5 sm:left-8 sm:bottom-3.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Diapositive ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
