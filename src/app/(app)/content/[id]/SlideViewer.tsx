"use client";

import { useState } from "react";
import DownloadButton from "./DownloadButton";

interface Slide {
  id: string;
  order: number;
  image_url: string | null;
}

export default function SlideViewer({ slides, title }: { slides: Slide[]; title: string }) {
  const [selected, setSelected] = useState(slides[0] ?? null);

  return (
    <div>
      {selected?.image_url ? (
        <div className="w-full rounded-2xl overflow-hidden">
          <img src={selected.image_url} alt={title} className="w-full h-auto" />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] rounded-2xl bg-[#1c1c1c] flex items-center justify-center">
          <span className="text-sm text-[#555]">Imagem não gerada</span>
        </div>
      )}

      {slides.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {slides.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`relative shrink-0 w-16 aspect-square rounded-xl bg-[#1c1c1c] overflow-hidden flex items-end justify-end p-1 transition-all ${
                selected?.id === s.id ? "ring-2 ring-white/60" : "opacity-60 hover:opacity-100"
              }`}
            >
              {s.image_url ? (
                <img src={s.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <span className="relative text-[10px] text-white/40">{s.order}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <DownloadButton imageUrl={selected?.image_url ?? null} title={title} />
      </div>
    </div>
  );
}
