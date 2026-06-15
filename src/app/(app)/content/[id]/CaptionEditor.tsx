"use client";

import { useState } from "react";

export default function CaptionEditor({
  packId,
  caption: initialCaption,
  cta: initialCta,
}: {
  packId: string;
  caption: string | null;
  cta: string | null;
}) {
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [cta, setCta] = useState(initialCta ?? "");
  const [editing, setEditing] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption);
  const [draftCta, setDraftCta] = useState(cta);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullText = cta ? `${caption}\n\n${cta}` : caption;

  async function copy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startEdit() {
    setDraftCaption(caption);
    setDraftCta(cta);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/packs/${packId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: draftCaption, cta: draftCta }),
    });
    setSaving(false);
    if (res.ok) {
      setCaption(draftCaption.trim());
      setCta(draftCta.trim());
      setEditing(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    const res = await fetch(`/api/packs/${packId}/regenerate-caption`, { method: "POST" });
    setRegenerating(false);
    if (res.ok) {
      const data = await res.json();
      setCaption(data.caption ?? "");
      setCta(data.cta ?? "");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366]">Legenda</p>
        {!editing && (
          <div className="flex items-center gap-4 md:gap-5 shrink-0">
            <button onClick={copy} className="flex items-center gap-1.5 text-sm font-semibold text-[#8A8A8E] hover:text-white transition-colors">
              {copied ? (
                <>
                  <svg width="15" height="15" fill="none" stroke="#30C46B" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                  <span className="text-[#30C46B]">copiado</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  <span>copiar</span>
                </>
              )}
            </button>
            <button onClick={startEdit} className="flex items-center gap-1.5 text-sm font-semibold text-[#8A8A8E] hover:text-white transition-colors">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              <span>editar</span>
            </button>
            <button onClick={regenerate} disabled={regenerating} className="flex items-center gap-1.5 text-sm font-semibold text-[#137EFF] hover:text-[#4a9eff] transition-colors disabled:opacity-50">
              <svg className={regenerating ? "animate-spin" : ""} width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 9 16 9" /></svg>
              <span>{regenerating ? "gerando..." : "regenerar"}</span>
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftCaption}
            onChange={(e) => setDraftCaption(e.target.value)}
            rows={5}
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-3 text-sm text-[#eee] leading-relaxed resize-none focus:outline-none focus:border-[#137EFF]"
            placeholder="Legenda..."
          />
          <input
            value={draftCta}
            onChange={(e) => setDraftCta(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-3 text-sm text-[#137EFF] focus:outline-none focus:border-[#137EFF]"
            placeholder="CTA (opcional)"
          />
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 h-10 rounded-xl bg-[#2b2b2b] text-sm font-medium text-[#aaa]">Cancelar</button>
            <button onClick={save} disabled={saving} className="flex-1 h-10 rounded-xl bg-[#137EFF] text-sm font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      ) : (
        <>
          {caption ? <p className="text-[15.5px] md:text-base leading-[1.6] text-[#E4E4E6] whitespace-pre-wrap">{caption}</p> : <p className="text-sm text-[#636366] italic">Sem legenda. Toque em regenerar.</p>}
          {cta && <p className="text-base text-[#137EFF] font-semibold leading-snug mt-2">{cta}</p>}
        </>
      )}
    </div>
  );
}
