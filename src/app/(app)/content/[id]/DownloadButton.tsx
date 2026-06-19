"use client";

import { useState } from "react";

export default function DownloadButton({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [downloading, setDownloading] = useState(false);
  const multiple = imageUrls.length > 1;

  async function handleDownload() {
    if (!imageUrls.length || downloading) return;
    setDownloading(true);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, "-");
      for (let i = 0; i < imageUrls.length; i++) {
        const res = await fetch(imageUrls[i]);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = multiple ? `${slug}-${i + 1}.png` : `${slug}.png`;
        a.click();
        URL.revokeObjectURL(url);
        // espaça os downloads pro navegador aceitar múltiplos arquivos
        if (multiple && i < imageUrls.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!imageUrls.length || downloading}
      className="w-full h-[58px] rounded-2xl bg-[#1A1A1C] border border-white/[0.07] text-white text-base font-bold flex items-center justify-center gap-2.5 hover:bg-[#262628] active:scale-[0.99] disabled:opacity-50 transition-all"
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
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 19h14M12 19l-5-5M12 19l5-5" />
          </svg>
          {multiple ? "Baixar todas" : "Baixar imagem"}
        </>
      )}
    </button>
  );
}
