"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Dedupe entre as 2 instâncias do card (mobile no topo + desktop no rail — ambas
// montam no DOM, só uma é visível por vez): compartilham um único fetch inicial.
// force=1 (após responder) sempre refaz.
let inflightPrompt: Promise<string | null> | null = null;
function fetchPrompt(force: boolean): Promise<string | null> {
  if (force) inflightPrompt = null;
  if (!inflightPrompt) {
    inflightPrompt = (async () => {
      try {
        const res = await fetch(`/api/prompt${force ? "?force=1" : ""}`);
        const data = await res.json().catch(() => ({}));
        return typeof data.prompt === "string" ? data.prompt : null;
      } catch {
        return null;
      }
    })();
  }
  return inflightPrompt;
}

// Card da home: o Bibliotecário pergunta algo (mirando o buraco do acervo) e a
// resposta vira anotação no feed (POST /api/updates). Ao responder, puxa a
// próxima pergunta (force=1) — o curador mira o próximo vão.
export default function LibrarianCard() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function loadPrompt(force = false) {
    try {
      setPrompt(await fetchPrompt(force));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPrompt(); }, []);

  async function submit() {
    const content = answer.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // manda a pergunta junto → backend sintetiza resposta+pergunta num fato limpo
        body: JSON.stringify({ content, prompt }),
      });
      if (res.ok) {
        setAnswer("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setLoading(true);
        await loadPrompt(true); // próxima pergunta (mira o próximo buraco)
        router.refresh();       // atualiza a estante (feed)
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-5">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-[13px] bg-[#242426] animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-1/3 rounded bg-[#242426] animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-[#242426] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-5">
      <div className="flex items-start gap-3.5">
        <span className="relative h-10 w-10 rounded-[13px] grid place-items-center shrink-0 ">
          <img
            className="h-12 w-12 object-cover -translate-y-1 translate-x-1 drop-shadow-[0_0_10px_rgba(123,84,255,0.4)]"
            src="/agents/bibliotecario_profile3.png"
            alt="perfil do bibliotecário"
          />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-[#B9A2FF] mb-1.5">O Bibliotecário quer saber</p>
          <p className="text-[15.5px] font-semibold leading-snug text-white">{prompt}</p>
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={2}
        maxLength={5000}
        placeholder="Escreva sua resposta — vira anotação no seu feed…"
        className="mt-3.5 w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-[#E4E4E6] leading-relaxed resize-none focus:outline-none focus:border-[#7B54FF]/60 transition-colors placeholder:text-[#636366]"
      />

      <div className="mt-2.5 flex items-center justify-between gap-3">
        {saved
          ? <span className="text-xs text-[#30C46B] font-medium">Anotado na estante! 📚</span>
          : <span className="text-xs text-[#636366]">Quanto mais você anota, melhor fica o conteúdo.</span>}
        <button
          onClick={submit}
          disabled={sending || !answer.trim()}
          className="h-9 px-4 rounded-lg bg-[#7B54FF] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shrink-0"
        >
          {sending ? "Anotando…" : "Anotar"}
        </button>
      </div>
    </div>
  );
}
