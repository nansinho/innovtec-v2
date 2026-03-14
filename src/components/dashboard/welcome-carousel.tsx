"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { News } from "@/lib/types/database";
import { getCarouselNews } from "@/actions/news";

interface Slide {
  badge: string;
  title: string;
  description: string;
  cta: string;
  image: string;
  gradient: string;
}

const fallbackSlides: Slide[] = [
  {
    badge: "Bienvenue",
    title: "Bienvenue sur l\u2019intranet INNOVTEC R\u00e9seaux",
    description: "Retrouvez toutes les informations de l\u2019entreprise, les actualit\u00e9s et vos outils au quotidien.",
    cta: "D\u00e9couvrir",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    gradient: "from-[#1E3A5F] to-[#0F2035]",
  },
];

const categoryGradients: Record<string, string> = {
  securite: "from-[#D97706] to-[#F59E0B]",
  entreprise: "from-[#1E3A5F] to-[#0F2035]",
  formation: "from-[#15803d] to-[#16a34a]",
  chantier: "from-[#1d4ed8] to-[#2563eb]",
  social: "from-[#6d28d9] to-[#7c3aed]",
  rh: "from-[#db2777] to-[#ec4899]",
};

function newsToSlide(news: News): Slide {
  const badge = news.priority === "urgent"
    ? `Urgent \u00b7 ${news.category}`
    : news.category.charAt(0).toUpperCase() + news.category.slice(1);

  return {
    badge,
    title: news.title,
    description: news.excerpt || news.content.slice(0, 120),
    cta: "Lire la suite",
    image: news.image_url || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    gradient: categoryGradients[news.category] ?? categoryGradients.entreprise,
  };
}

export default function WelcomeCarousel() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getCarouselNews().then((news) => {
      if (news.length > 0) {
        setSlides(news.map((n) => newsToSlide(n as News)));
      }
    });
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative h-[240px] overflow-hidden rounded-[var(--radius)]">
      <div
        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`flex min-w-full bg-gradient-to-br ${slide.gradient}`}
          >
            <div className="z-[2] flex flex-1 flex-col justify-center px-8 py-8">
              <span className="mb-3 inline-block w-fit rounded-[var(--radius-xs)] bg-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                {slide.badge}
              </span>
              <h2 className="mb-2 text-xl font-semibold leading-tight tracking-tight text-white">
                {slide.title}
              </h2>
              <p className="max-w-[380px] text-[13px] leading-relaxed text-white/70">
                {slide.description}
              </p>
              <button className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-[var(--radius)] bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D97706]">
                {slide.cta}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="relative hidden w-[40%] overflow-hidden sm:block">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 0vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute right-4 top-4 z-[5] rounded-[var(--radius-xs)] bg-black/20 px-2 py-0.5 font-mono text-[10px] text-white/60 backdrop-blur-sm">
        {String(current + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 z-[5] flex gap-1.5">
          <button
            onClick={prev}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Pr\u00e9c\u00e9dent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dots */}
      <div className="absolute bottom-4 left-8 z-[5] flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
            aria-label={`Diapositive ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
