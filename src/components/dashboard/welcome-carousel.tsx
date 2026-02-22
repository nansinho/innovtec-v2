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
    gradient: "from-[var(--navy)] to-[#2a4a7a]",
  },
];

const categoryGradients: Record<string, string> = {
  securite: "from-[#F5A623] to-[#f0c060]",
  entreprise: "from-[var(--navy)] to-[#2a4a7a]",
  formation: "from-[#16a34a] to-[#22c55e]",
  chantier: "from-[#2563eb] to-[#3b82f6]",
  social: "from-[#7c3aed] to-[#8b5cf6]",
  rh: "from-[#ec4899] to-[#f472b6]",
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
    <div className="relative h-[260px] overflow-hidden rounded-2xl">
      <div
        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`flex min-w-full bg-gradient-to-br ${slide.gradient}`}
          >
            <div className="z-[2] flex flex-1 flex-col justify-center px-8 py-9">
              <span className="mb-3 inline-block w-fit rounded-full bg-white/20 px-2.5 py-1 text-[8px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                {slide.badge}
              </span>
              <h2 className="mb-2 text-[22px] font-semibold leading-tight tracking-tight text-white">
                {slide.title}
              </h2>
              <p className="max-w-[400px] text-[12.5px] font-light leading-relaxed text-white/75">
                {slide.description}
              </p>
              <button className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-sm)] bg-white px-[18px] py-2 text-[11.5px] font-medium text-[var(--heading)] transition-colors hover:bg-white/90">
                {slide.cta}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative hidden w-[42%] overflow-hidden sm:block">
              <Image
                src={slide.image}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute right-4 top-4 z-[5] rounded bg-black/15 px-2 py-0.5 font-mono text-[10px] text-white/50 backdrop-blur-sm">
        {String(current + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-5 z-[5] flex gap-1">
          <button
            onClick={prev}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={next}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dots */}
      <div className="absolute bottom-5 left-8 z-[5] flex gap-[5px]">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
