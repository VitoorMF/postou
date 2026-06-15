"use client";

import { useState } from "react";

interface Slide {
  id: string;
  order: number;
  image_url: string | null;
}

export default function SlideViewer({ slides, title, type }: { slides: Slide[]; title: string; type: string }) {
  const [selected, setSelected] = useState(slides[0] ?? null);

  // só carrossel mostra a tira de thumbnails; post/story é imagem única
  const showThumbs = type === "carrossel" && slides.length > 1;

  return (
    <div className="flex flex-col gap-3.5">
      {selected?.image_url ? (
        <div className="w-full rounded-[20px] overflow-hidden bg-[#111] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)]">
          <img src={selected.image_url} alt={title} className="w-full h-auto" />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] rounded-[20px] bg-[#1A1A1C] flex items-center justify-center">
          <span className="text-sm text-[#636366]">Imagem não gerada</span>
        </div>
      )}

      {showThumbs && (
        <div className="flex gap-2.5">
          {slides.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`relative flex-1 aspect-[1080/1350] rounded-[11px] bg-[#1A1A1C] overflow-hidden border-2 transition-all ${
                selected?.id === s.id ? "border-[#137EFF] opacity-100" : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              {s.image_url ? (
                <img src={s.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <span className="absolute bottom-1 right-1 w-[17px] h-[17px] rounded-full bg-black/50 text-white text-[11px] font-extrabold flex items-center justify-center">{s.order}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
