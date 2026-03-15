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
    title: "Bienvenue sur l'intranet INNOVTEC Réseaux",
    description: "Retrouvez toutes les informations de l'entreprise, les actualités et vos outils au quotidien.",
    cta: "Découvrir",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    gradient: "from-[#1E3A5F] via-[#1a3355] to-[#0F2035]",
  },
];

const categoryGradients: Record<string, string> = {
  securite: "from-amber-600 via-amber-500 to-yellow-500",
  entreprise: "from-[#1E3A5F] via-[#1a3355] to-[#0F2035]",
  formation: "from-emerald-700 via-emerald-600 to-green-500",
  chantier: "from-blue-700 via-blue-600 to-indigo-500",
  social: "from-violet-700 via-purple-600 to-fuchsia-500",
  rh: "from-pink-700 via-pink-600 to-rose-500",
};

function newsToSlide(news: News): Slide {
  const badge = news.priority === "urgent"
    ? `Urgent · ${news.category}`
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
    <div className="relative h-[260px] overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
      <div
        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`flex min-w-full bg-gradient-to-br ${slide.gradient}`}
          >
            <div className="z-[2] flex flex-1 flex-col justify-center px-10 py-8">
              <span className="mb-3 inline-block w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                {slide.badge}
              </span>
              <h2 className="mb-2 text-2xl font-bold leading-snug tracking-tight text-white">
                {slide.title}
              </h2>
              <p className="max-w-[400px] text-[15px] leading-relaxed text-white/80">
                {slide.description}
              </p>
              <button className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-700/20 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-md active:scale-[0.97]">
                {slide.cta}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative hidden w-[42%] overflow-hidden sm:block">
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
        ))}
      </div>

      {/* Counter */}
      <div className="absolute right-4 top-3 z-[5] rounded-full bg-black/25 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white/70 backdrop-blur-sm">
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 z-[5] flex gap-1.5">
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
      )}

      {/* Dots */}
      <div className="absolute bottom-3.5 left-8 z-[5] flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Diapositive ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
