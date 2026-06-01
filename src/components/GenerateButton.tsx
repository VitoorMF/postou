"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Format = "post" | "carrossel" | "story";
type Status = "idle" | "loading" | "success" | "error";

const FORMATS: { key: Format; label: string; sub: string }[] = [
  { key: "story",    label: "Story",     sub: "1 imagem vertical" },
  { key: "post",     label: "Post",      sub: "1 imagem de destaque" },
  { key: "carrossel",label: "Carrossel", sub: "4–5 slides" },
];

export default function GenerateButton() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("");
  const [format, setFormat] = useState<Format>("story");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("error"); setMessage("Não autenticado"); return; }

    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!kit) { setStatus("error"); setMessage("Brand kit não encontrado"); return; }

    const { data: { session } } = await supabase.auth.getSession();

    const body: Record<string, string> = { brand_kit_id: kit.id, force_type: format };
    if (theme.trim()) body.theme_override = theme.trim();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Erro desconhecido");
      return;
    }

    setStatus("success");
    setOpen(false);
    setTheme("");
    router.refresh();
    setTimeout(() => setStatus("idle"), 3000);
  }

  function handleClose() {
    if (status === "loading") return;
    setOpen(false);
    setTheme("");
    setStatus("idle");
    setMessage("");
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 h-11 rounded-full shadow-lg text-sm font-medium transition-all ${
          status === "success" ? "bg-emerald-600 text-white" : "bg-[#137EFF] text-white"
        }`}
      >
        {status === "success" ? (
          <>✓ Gerado!</>
        ) : (
          <>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Gerar conteúdo
          </>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5">

            {/* Handle */}
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Gerar conteúdo</h2>
              <button onClick={handleClose} className="text-[#666] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            {/* Tema */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#555] tracking-widest">TEMA (opcional)</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: lançamento do produto, dica de uso..."
                className="w-full bg-[#242424] text-white text-sm rounded-xl px-4 h-11 placeholder:text-[#444] outline-none focus:ring-1 focus:ring-[#137EFF]"
              />
              <p className="text-xs text-[#555]">Deixe vazio para a IA escolher o tema automaticamente.</p>
            </div>

            {/* Formato */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#555] tracking-widest">FORMATO</label>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                      format === f.key
                        ? "border-[#137EFF] bg-[#137EFF]/10 text-white"
                        : "border-[#2e2e2e] bg-[#242424] text-[#888079]"
                    }`}
                  >
                    {f.label}
                    <span className="text-[10px] font-normal opacity-60">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Erro */}
            {status === "error" && (
              <p className="text-sm text-red-400">{message}</p>
            )}

            {/* Botão gerar */}
            <button
              onClick={handleGenerate}
              disabled={status === "loading"}
              className="w-full h-12 rounded-2xl bg-[#137EFF] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Gerar agora
                </>
              )}
            </button>

          </div>
        </div>
      )}
    </>
  );
}
