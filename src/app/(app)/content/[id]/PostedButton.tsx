"use client";

import { useState } from "react";

export default function PostedButton({ packId, initialPosted }: { packId: string; initialPosted: boolean }) {
  const [posted, setPosted] = useState(initialPosted);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !posted;
    setPosted(next); // otimista
    const res = await fetch(`/api/packs/${packId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posted: next }),
    });
    if (!res.ok) setPosted(!next); // reverte se falhar
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`w-full h-[58px] rounded-2xl border border-white/[0.07] text-base font-bold flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all disabled:opacity-60 ${
        posted ? "bg-[#1A1A1C] text-[#30C46B]" : "bg-[#1A1A1C] text-white hover:bg-[#262628]"
      }`}
    >
      {posted ? (
        <>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12 11 14.5 16 9.5" /></svg>
          Postado
        </>
      ) : (
        <>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
          Marcar como postado
        </>
      )}
    </button>
  );
}
