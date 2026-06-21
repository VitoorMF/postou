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
}: {
  packId: string;
  imageUrls: string[];
  title: string;
  text: string;
  initialPosted: boolean;
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
      <ShareButton
        imageUrls={imageUrls}
        title={title}
        text={text}
        onShared={() => { if (!posted) markPosted(true); }}
      />
      <DownloadButton imageUrls={imageUrls} title={title} />
      <PostedButton posted={posted} busy={busy} onToggle={() => markPosted(!posted)} />
    </div>
  );
}
