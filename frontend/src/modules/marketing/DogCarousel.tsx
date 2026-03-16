"use client";

import { useEffect, useState } from "react";

const DOG_IMAGES = [
  {
    src: "/dogs/img5.jpg",
    alt: "Small white dog with a bow being groomed at the salon",
  },
  {
    src: "/dogs/img2.jpg",
    alt: "Golden retriever being washed in a grooming tub",
  },
  {
    src: "/dogs/img3.jpg",
    alt: "Groomer brushing a fluffy dog on the grooming table",
  },
];

export function DogCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % DOG_IMAGES.length);
    }, 4500);

    return () => clearInterval(id);
  }, []);

  const current = DOG_IMAGES[index];

  const goTo = (i: number) => {
    setIndex(i);
  };

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-slate-900/35 to-slate-900/0" />

      <img
        src={current.src}
        alt={current.alt}
        className="h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />

      <div className="pointer-events-none absolute left-6 top-6 space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200/90">
          Grooming days
        </p>
        <p className="max-w-[16rem] text-sm font-semibold text-slate-50">
          Clean, happy pups after every grooming appointment.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[11px] font-semibold text-slate-900">
            {index + 1}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-100/80">
            Before &amp; after moments
          </span>
        </div>

        <div className="flex items-center gap-2">
          {DOG_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 w-5 rounded-full transition ${
                i === index ? "bg-cyan-300" : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

