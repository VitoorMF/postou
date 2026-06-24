"use client";

import { useState } from "react";
import ShareButton from "@/components/ShareButton";
import DownloadButton from "./DownloadButton";
import PostedButton from "./PostedButton";

// Agrupa as ações do post pra compartilhar o estado "postado" entre o ShareButton
// (que marca como postado ao compartilhar) e o PostedButton (toggle manual).
export default function ContentActions({
  packId,
  imageUrls,
  title,
  text,
  initialPosted,
  incomplete = false,
}: {
  packId: string;
  imageUrls: string[];
  title: string;
  text: string;
  initialPosted: boolean;
  incomplete?: boolean;
}) {
  const [posted, setPosted] = useState(initialPosted);
  const [busy, setBusy] = useState(false);

  async function markPosted(next: boolean) {
    if (busy) return;
    setBusy(true);
    setPosted(next); // otimista
    try {
      const res = await fetch(`/api/packs/${packId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted: next }),
      });
      if (!res.ok) setPosted(!next); // reverte se falhar
    } catch {
      setPosted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {incomplete ? (
        <div className="rounded-2xl border border-[#F0871E]/30 bg-[#F0871E]/10 px-4 py-3.5 text-sm text-[#F0871E] font-medium leading-snug">
          Tem slide sem imagem. Refaça o slide marcado com ⚠️ pra liberar compartilhar e baixar.
        </div>
      ) : (
        <>
          <ShareButton
            imageUrls={imageUrls}
            title={title}
            text={text}
            onShared={() => { if (!posted) markPosted(true); }}
          />
          <DownloadButton imageUrls={imageUrls} title={title} />
        </>
      )}
      <PostedButton posted={posted} busy={busy} onToggle={() => markPosted(!posted)} />
    </div>
  );
}
