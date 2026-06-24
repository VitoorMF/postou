"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Slide {
  id: string;
  order: number;
  image_url: string | null;
}

export default function SlideViewer({ slides, title, type, packId }: { slides: Slide[]; title: string; type: string; packId: string }) {
  // guarda o ID (não o objeto) — após refresh os slides chegam com a imagem nova
  const [selectedId, setSelectedId] = useState(slides[0]?.id ?? null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const router = useRouter();

  const selected = slides.find((s) => s.id === selectedId) ?? slides[0] ?? null;
  const showThumbs = type === "carrossel" && slides.length > 1;

  async function regen(slide: Slide) {
    if (regenId) return;
    setRegenId(slide.id);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ regen_slide_id: slide.id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setRegenId(null);
    }
  }

  const regenSelected = !!selected && regenId === selected.id;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Imagem principal */}
      {regenSelected ? (
        <div className="w-full aspect-[4/5] rounded-[20px] bg-[#1A1A1C] flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin" width="26" height="26" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#137EFF" strokeWidth="3" />
            <path className="opacity-90" fill="#137EFF" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-semibold text-white">Refazendo esse slide…</span>
        </div>
      ) : selected?.image_url ? (
        <div className="w-full rounded-[20px] overflow-hidden bg-[#111] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)]">
          <img src={selected.image_url} alt={title} className="w-full h-auto" />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] rounded-[20px] bg-[#1A1A1C] border border-[#F0871E]/25 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[#F0871E]/12 grid place-items-center">
            <svg width="24" height="24" fill="none" stroke="#F0871E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <span className="text-sm font-semibold text-white">Esse slide não foi gerado</span>
          {selected && (
            <button
              onClick={() => regen(selected)}
              disabled={!!regenId}
              className="mt-1 h-10 px-5 rounded-xl bg-[#137EFF] text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Refazer slide
            </button>
          )}
        </div>
      )}

      {showThumbs && (
        <div className="flex gap-2.5">
          {slides.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`relative flex-1 aspect-[1080/1350] rounded-[11px] bg-[#1A1A1C] overflow-hidden border-2 transition-all ${
                selected?.id === s.id ? "border-[#137EFF] opacity-100" : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              {s.image_url ? (
                <img src={s.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="18" height="18" fill="none" stroke="#F0871E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
              )}
              {regenId === s.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" /><path className="opacity-90" fill="#fff" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-[17px] h-[17px] rounded-full bg-black/50 text-white text-[11px] font-extrabold flex items-center justify-center">{s.order}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
