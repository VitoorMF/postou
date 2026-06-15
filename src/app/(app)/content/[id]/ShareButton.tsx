"use client";

import { useState } from "react";

export default function ShareButton({ imageUrls, title, text }: { imageUrls: string[]; title: string; text: string }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, "-");
      // baixa todas as imagens (carrossel manda todas; post/story só 1)
      const settled = await Promise.all(
        imageUrls.map(async (url, i) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            return new File([blob], `${slug}-${i + 1}.png`, { type: blob.type || "image/png" });
          } catch {
            return null;
          }
        })
      );
      const files = settled.filter((f): f is File => f !== null);

      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };

      if (files.length && nav.canShare?.({ files })) {
        await nav.share({ files, text });
      } else if (nav.share) {
        await nav.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      /* usuário cancelou — ignora */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      className="w-full h-[58px] rounded-2xl bg-[#137EFF] text-white text-base font-bold flex items-center justify-center gap-2.5 shadow-[0_14px_32px_-10px_rgba(19,126,255,0.6)] hover:bg-[#0f6ae0] active:scale-[0.99] disabled:opacity-50 transition-all"
    >
      {busy ? (
        <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : copied ? (
        <>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          Legenda copiada!
        </>
      ) : (
        <>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M16 6l-4-4-4 4M12 2v14" />
          </svg>
          Compartilhar
        </>
      )}
    </button>
  );
}
