"use client";

import { useState } from "react";

// Salva a capa deste post na biblioteca de Modelos (âncora de estilo).
// A partir dele, dá pra "gerar com este modelo" na aba Modelos.
export default function UseAsTemplateButton({ packId }: { packId: string }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (state === "saving" || state === "saved") return;
    setState("saving");
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });
      setState(res.ok ? "saved" : "error");
      if (!res.ok) setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const label =
    state === "saved" ? "Salvo nos modelos ✓"
    : state === "saving" ? "Salvando…"
    : state === "error" ? "Erro — tente de novo"
    : "Usar como modelo";

  return (
    <button
      onClick={save}
      disabled={state === "saving" || state === "saved"}
      className={`mt-7 w-full h-12 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
        state === "saved"
          ? "border-[#7B54FF]/40 bg-[#7B54FF]/12 text-[#B9A2FF]"
          : "border-white/[0.1] bg-[#1A1A1C] text-[#C7C7CC] hover:border-[#7B54FF]/40 hover:text-white"
      }`}
    >
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
      {label}
    </button>
  );
}
