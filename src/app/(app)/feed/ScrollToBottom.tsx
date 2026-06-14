"use client";

import { useEffect } from "react";

// Rola o feed até o final ao carregar (estilo chat).
// Renderizado DENTRO da lista (Suspense), então só monta com o conteúdo presente.
export default function ScrollToBottom() {
  useEffect(() => {
    const el = document.getElementById("feed-scroll");
    if (!el) return;
    const toBottom = () => { el.scrollTop = el.scrollHeight; };

    toBottom();
    requestAnimationFrame(() => requestAnimationFrame(toBottom));

    // re-rola em mudanças de altura (imagens carregando, layout tardio) por ~1.2s
    const ro = new ResizeObserver(toBottom);
    ro.observe(el);
    const stop = setTimeout(() => ro.disconnect(), 1200);

    return () => { clearTimeout(stop); ro.disconnect(); };
  }, []);

  return null;
}
