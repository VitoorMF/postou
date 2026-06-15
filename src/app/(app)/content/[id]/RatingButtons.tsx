"use client";

import { useState } from "react";

export default function RatingButtons({ packId, initialRating }: { packId: string; initialRating: number | null }) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [busy, setBusy] = useState(false);

  async function vote(value: 1 | -1) {
    if (busy) return;
    setBusy(true);
    const next = rating === value ? null : value; // toggle
    const prev = rating;
    setRating(next); // otimista
    const res = await fetch(`/api/packs/${packId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: next }),
    });
    if (!res.ok) setRating(prev);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3.5 mt-7">
      <span className="text-sm text-[#636366] font-medium flex-1 md:flex-none">Essa geração ficou boa?</span>
      <button
        onClick={() => vote(1)}
        disabled={busy}
        className={`h-11 w-11 rounded-[13px] border flex items-center justify-center transition-all active:scale-95 disabled:opacity-60 ${
          rating === 1 ? "text-[#30C46B] border-[rgba(48,196,107,0.5)] bg-[rgba(48,196,107,0.16)]" : "text-[#8A8A8E] border-white/[0.07] bg-[#1A1A1C] hover:text-white hover:bg-[#262628]"
        }`}
        aria-label="Gostei"
      >
        <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M7 10v11" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L14 2a3.13 3.13 0 0 1 1 3.88Z" /></svg>
      </button>
      <button
        onClick={() => vote(-1)}
        disabled={busy}
        className={`h-11 w-11 rounded-[13px] border flex items-center justify-center transition-all active:scale-95 disabled:opacity-60 ${
          rating === -1 ? "text-[#ff7a7a] border-[rgba(255,80,80,0.4)] bg-[rgba(255,80,80,0.1)]" : "text-[#8A8A8E] border-white/[0.07] bg-[#1A1A1C] hover:text-white hover:bg-[#262628]"
        }`}
        aria-label="Não gostei"
      >
        <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 14V3" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L10 22a3.13 3.13 0 0 1-1-3.88Z" /></svg>
      </button>
    </div>
  );
}
