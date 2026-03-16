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
  title: string;
  description: string;
  cta: string;
  image: string;
}

const fallbackSlides: Slide[] = [
  {
    id: null,
    badge: "Bienvenue",
    title: "Bienvenue sur l'intranet INNOVTEC Réseaux",
    description: "Retrouvez toutes les informations de l'entreprise, les actualités et vos outils au quotidien.",
    cta: "Découvrir",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
  },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function newsToSlide(news: News): Slide {
  const badge = news.priority === "urgent"
    ? `Urgent · ${news.category}`
    : news.category.charAt(0).toUpperCase() + news.category.slice(1);

  const rawDescription = news.excerpt || news.content.slice(0, 120);

  return {
    id: news.id,
    badge,
    title: news.title,
    description: stripHtml(rawDescription),
    cta: "Lire la suite",
    image: news.image_url || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
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
    <div className="relative overflow-hidden rounded-xl bg-gray-900">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => {
            const inner = (
              <div className="relative flex h-[220px] w-full sm:h-[260px]">
                {/* Background image */}
                <div className="absolute inset-0">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-[2] flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 sm:py-8">
                  <span className="mb-2 inline-block w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-white backdrop-blur-sm sm:mb-3">
                    {slide.badge}
                  </span>
                  <h2 className="mb-1.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-white sm:mb-2 sm:text-[22px]">
                    {slide.title}
                  </h2>
                  <p className="hidden max-w-[420px] text-[14px] leading-relaxed text-white/60 line-clamp-2 sm:block">
                    {slide.description}
                  </p>
                  <span className="mt-3 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/80 transition-all duration-200 group-hover:gap-3 group-hover:text-white sm:mt-5">
                    {slide.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
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

          {/* Arrows */}
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
          <div className="absolute bottom-3 left-6 z-[5] flex gap-1.5 sm:bottom-3.5 sm:left-8">
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
