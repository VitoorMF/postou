"use client";

import { useState } from "react";

export default function DownloadButton({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!imageUrl || downloading) return;
    setDownloading(true);

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!imageUrl || downloading}
      className="w-full h-12 rounded-2xl bg-[#137EFF] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
    >
      {downloading ? (
        <>
          <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Baixando...
        </>
      ) : (
        <>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 19h14M12 19l-5-5M12 19l5-5" />
          </svg>
          Baixar imagem
        </>
      )}
    </button>
  );
}
