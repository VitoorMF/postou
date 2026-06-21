"use client";

import { useState } from "react";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import CardPostedToggle from "./CardPostedToggle";

// Corpo client do card (conteúdo + ações). Segura o estado "postado" compartilhado
// entre o indicador e o ShareButton (compartilhar marca como postado).
export default function PackCardBody({
  id,
  type,
  badgeClass,
  timeLabel,
  isCarrossel,
  title,
  caption,
  cta,
  postedAt,
  slides,
}: {
  id: string;
  type: string;
  badgeClass: string;
  timeLabel: string;
  isCarrossel: boolean;
  title: string;
  caption: string | null;
  cta: string | null;
  postedAt: string | null;
  slides: { order: number; image_url: string | null }[];
}) {
  const [posted, setPosted] = useState(!!postedAt);
  const [busy, setBusy] = useState(false);

  async function markPosted(next: boolean) {
    if (busy) return;
    setBusy(true);
    setPosted(next); // otimista
    try {
      const res = await fetch(`/api/packs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: next }),
      });
      if (!res.ok) setPosted(!next);
    } catch {
      setPosted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md lowercase ${badgeClass}`}>{type}</span>
          <span className="text-xs text-[#636366]">
            {isCarrossel ? `${slides.length} imagens` : "1 imagem"} · {timeLabel}
          </span>
          <CardPostedToggle posted={posted} busy={busy} onToggle={() => markPosted(!posted)} />
        </div>
        <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
        {caption && <p className="text-sm text-[#8A8A8E] leading-snug line-clamp-2">{caption}</p>}
        {cta && (
          <div className="flex items-start gap-1.5 mt-0.5">
            <svg width="13" height="13" fill="none" stroke="#137EFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            <span className="text-[13px] text-[#137EFF] font-medium leading-snug">{cta}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4 mt-auto">
        <Link href={`/content/${id}`} className="flex-[3] h-10 rounded-xl bg-[#262628] text-sm font-medium text-white flex items-center justify-center gap-2">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          ver
        </Link>
        <ShareButton
          imageUrls={[...slides].sort((a, b) => a.order - b.order).map((s) => s.image_url).filter((u): u is string => !!u)}
          title={title}
          text={`${title}${caption ? `\n\n${caption}` : ""}${cta ? `\n\n${cta}` : ""}`}
          onShared={() => { if (!posted) markPosted(true); }}
          className="flex-[7] h-10 rounded-xl bg-[#137EFF] text-sm font-medium text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        />
      </div>
    </>
  );
}
