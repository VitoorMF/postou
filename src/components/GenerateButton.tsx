"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getLimits } from "@/lib/plans";
import { useGeneration } from "@/components/GenerationProvider";

type Format = "post" | "carrossel" | "story";
type Status = "idle" | "loading" | "success" | "error" | "limit";

function WandIcon({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M108.88 84.58a6.54 6.54 0 0 0-1.88-4.85c-2.07-2-5.66-2.86-12-2.74a104.14 104.14 0 0 0-19.37 2.68A101.56 101.56 0 0 0 63.83 83c-3 1-5.07 1.71-7.48 1.71h-.09a4.64 4.64 0 0 1-4-1.9 5 5 0 0 1-.35-4.67A31.41 31.41 0 0 0 53.7 64.5c-.66-6.45-3.87-10.16-8.82-10.2a5.51 5.51 0 0 0-4.21 1.58c-1.81 1.88-1.84 4.74-1.71 7.75.11 2.74-2.87 5.53-4.65 7.2-4 3.78-7.08 9.3-7.75 14.06-.1.71-.17 1.36-.24 2a8.13 8.13 0 0 1-.65 3.08A68.14 68.14 0 0 1 19.38 95a2 2 0 0 0-.79 1.32c0 .25-.81 6.14 5.15 13.71 4.27 5.43 10.37 7.88 14.3 7.88h.14a3.74 3.74 0 0 0 3.16-1.26c1-1.39 4.87-5.59 6.4-6.41 3.87-2.09 7.77-4 11.28-5.55 8.3-.16 29.49-.3 34.29.89a10 10 0 0 0 2.46.3c3.61 0 7.37-1.81 8.53-5.49a8 8 0 0 0-.38-6.51 7.32 7.32 0 0 0-1.44-1.81c5.15-1.72 6.38-4.9 6.4-7.49zm-8.39 14.61c-.7 2.21-3.84 3.1-6.21 2.51-3.94-1-16.13-1.14-25.2-1.11l.94-.35a128.58 128.58 0 0 1 26.46-6.94c2 .58 3.34 1.44 3.93 2.51a4.26 4.26 0 0 1 .08 3.38zM98.33 89c-16.07 2.46-24.6 5.64-29.7 7.54l-1.51.46a172.06 172.06 0 0 0-21.28 9.68c-2.33 1.25-6.2 5.67-7.43 7.19-1.63.23-7.39-1.08-11.53-6.35-3.71-4.71-4.28-8.4-4.34-9.91 1.88-1.41 5.44-4.14 6.31-5.26 1-1.35 1.23-3 1.47-5.08.06-.56.13-1.17.22-1.84.55-3.86 3.17-8.56 6.53-11.7 2.13-2 6.1-5.72 5.9-10.29-.06-1.4-.17-4 .6-4.8.09-.09.35-.36 1.27-.36 2.79 0 4.43 2.24 4.87 6.61a27.21 27.21 0 0 1-1.51 11.85 8.94 8.94 0 0 0 .8 8.35 8.64 8.64 0 0 0 7.26 3.64c3.12 0 5.53-.79 8.87-1.91a96.7 96.7 0 0 1 11.46-3.24A99.21 99.21 0 0 1 95.16 81c4.86-.09 7.9.44 9.06 1.59a2.47 2.47 0 0 1 .66 2c-.01.8-.03 3.41-6.55 4.41z" />
      <path d="M37.72 44c.15 0 15.42 2.28 21.72 8.58S68 74.13 68 74.28a2 2 0 0 0 4 0c0-.15 2.28-15.42 8.58-21.72S102.13 44 102.28 44a2 2 0 0 0 0-4c-.15 0-15.42-2.28-21.72-8.58S72 9.87 72 9.72a2 2 0 0 0-4 0c0 .15-2.28 15.42-8.58 21.72S37.87 40 37.72 40a2 2 0 0 0 0 4z" />
      <path d="M88 26a2 2 0 0 0 1.41-.59l4-4a2 2 0 0 0-2.82-2.82l-4 4A2 2 0 0 0 88 26zM86.59 58.59a2 2 0 0 0 0 2.82l4 4a2 2 0 0 0 2.82-2.82l-4-4a2 2 0 0 0-2.82 0zM50.59 25.41a2 2 0 0 0 2.82-2.82l-4-4a2 2 0 0 0-2.82 2.82z" />
    </svg>
  );
}

const FORMATS: { key: Format; label: string; sub: string }[] = [
  { key: "story", label: "Story", sub: "1 imagem vertical" },
  { key: "post", label: "Post", sub: "1 imagem de destaque" },
  { key: "carrossel", label: "Carrossel", sub: "4–5 slides" },
];

export default function GenerateButton({ variant = "floating" }: { variant?: "floating" | "inline" | "card" | "panel" | "tile" }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [theme, setTheme] = useState("");
  const [format, setFormat] = useState<Format>("story");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const router = useRouter();
  const { generate } = useGeneration();

  // ─── Cotas do usuário ──────────────────────────────────────────────
  const [plan, setPlan] = useState("free");
  const [manualCount, setManualCount] = useState(0);
  const [carrosselCount, setCarrosselCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("plan, weekly_manual_count, weekly_carrossel_count")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setPlan(data.plan ?? "free");
        setManualCount(data.weekly_manual_count ?? 0);
        setCarrosselCount(data.weekly_carrossel_count ?? 0);
      }
    });
  }, []);

  const limits = getLimits(plan);
  const manualExhausted = manualCount >= limits.manual;
  const carrosselBlocked = carrosselCount >= limits.carrossel; // free → carrossel=0 → sempre true

  // ─── Swipe-to-dismiss ──────────────────────────────────────────────
  function onDragStart(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    // só permite arrastar pra baixo
    if (delta > 0) setDragY(delta);
  }

  function onDragEnd() {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    // passou de 120px → fecha; senão volta
    if (dragY > 120) {
      handleClose();
      setDragY(0);
    } else {
      setDragY(0);
    }
  }

  function handleGenerate() {
    if (manualExhausted) return;
    // dispara a geração no provider (banner global, sobrevive à navegação)
    generate({ format, theme });
    // fecha o modal e leva pra Hoje, onde o banner mostra "gerando…"
    const onHoje = window.location.pathname === "/hoje";
    setTheme("");
    setStatus("idle");
    setMessage("");
    dismiss();
    if (!onHoje) router.push("/hoje");
  }

  // Anima a saída antes de desmontar
  function dismiss() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 240);
  }

  function handleClose() {
    if (status === "loading") return;
    dismiss();
    setTheme("");
    setStatus("idle");
    setMessage("");
  }


  const locked = manualExhausted;

  return (
    <>
      {variant === "card" ? (
        /* Card "Criar post" (home) */
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-[20px] p-4 flex items-center gap-4 border border-[#7b54ff]/25 active:scale-[0.99] transition-transform"
          style={{ background: "linear-gradient(135deg, rgba(123,84,255,0.14), rgba(47,107,255,0.06))" }}
        >
          <div className="h-12 w-12 rounded-[14px] grid place-items-center shrink-0" style={{ background: "linear-gradient(160deg,#7b54ff,#4169e1)", boxShadow: "0 8px 20px -6px rgba(123,84,255,.6)" }}>
            <WandIcon size={24} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-white">Criar post</span>
              <span className="text-[10px] font-bold tracking-wider bg-[#7b54ff]/20 text-[#B9A2FF] px-2 py-0.5 rounded-md">MANUAL</span>
            </div>
            <p className="text-[#8A8A8E] text-[13.5px] mt-0.5 leading-snug">Você escolhe o tema e o formato</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-white/[0.06] grid place-items-center shrink-0">
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
        </button>
      ) : variant === "panel" ? (
        /* Card vertical do rail (desktop) */
        <div
          className={`rounded-[22px] p-5 border ${locked ? "border-[#F0871E]/35" : "border-[#7b54ff]/25"}`}
          style={{
            background: locked
              ? "linear-gradient(160deg, rgba(240,135,30,0.12), rgba(240,135,30,0.02))"
              : "linear-gradient(160deg, rgba(123,84,255,0.16), rgba(47,107,255,0.05))"
          }}
        >
          <div className="h-12 w-12 rounded-[14px] grid place-items-center mb-4" style={{ background: locked ? "rgba(240,135,30,0.16)" : "linear-gradient(160deg,#7b54ff,#4169e1)", boxShadow: locked ? "none" : "0 8px 20px -6px rgba(123,84,255,.6)" }}>
            <WandIcon size={24} color={locked ? "#F0871E" : "white"} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[19px] font-extrabold text-white">{locked ? "Limite manual" : "Criar post"}</span>
            {!locked && (
              <span className="text-[10px] font-bold tracking-wider bg-[#7b54ff]/20 text-[#B9A2FF] px-2 py-0.5 rounded-md">MANUAL</span>
            )}
          </div>
          <p className="text-[#8A8A8E] text-[14px] mb-4 leading-snug">
            {locked
              ? `Você usou suas ${limits.manual} gerações manuais. Faça upgrade para criar mais.`
              : "Você escolhe o tema e o formato. A IA monta o post na sua marca."}
          </p>
          {locked ? (
            <button onClick={() => router.push("/settings/plans")} className="w-full h-[52px] rounded-[14px] bg-[#F0871E] text-white text-[15px] font-bold flex items-center justify-center gap-2">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Fazer upgrade
            </button>
          ) : (
            <button onClick={() => setOpen(true)} className="w-full h-[52px] rounded-[14px] bg-white text-[#111] text-[15px] font-bold flex items-center justify-center gap-2">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Abrir gerador
            </button>
          )}
        </div>
      ) : variant === "tile" ? (
        /* Tile "Novo post" tracejado (desktop) */
        <button
          onClick={() => setOpen(true)}
          className="h-full min-h-[180px] w-full rounded-[18px] border border-dashed border-white/[0.14] flex flex-col items-center justify-center gap-2.5 hover:bg-white/[0.02] transition-colors"
        >
          <span className="h-12 w-12 rounded-[14px] grid place-items-center" style={{ background: "linear-gradient(160deg,#7b54ff,#4169e1)" }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </span>
          <span className="text-[14px] font-bold text-white">Novo post</span>
          <span className="text-[12px] text-[#636366]">manual</span>
        </button>
      ) : variant === "inline" ? (
        /* Botão grande inline (home) */
        <button
          onClick={() => !locked && setOpen(true)}
          className={`relative w-full h-[60px] rounded-[19px] flex items-center justify-center gap-3 text-[17px] font-extrabold tracking-tight overflow-hidden transition-transform active:scale-[0.98] ${locked
            ? "bg-[#262628] text-[#8A8A8E] cursor-not-allowed"
            : "text-white"
            }`}
          style={
            locked
              ? undefined
              : {
                background: "linear-gradient(180deg,#3b76ff,#2f6bff)",
                boxShadow: "0 14px 34px -10px rgba(47,107,255,.7), inset 0 1px 0 rgba(255,255,255,.25)",
              }
          }
        >
          {locked ? (
            <>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Limite atingido
            </>
          ) : (
            <>
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,.5))" }}>
                <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />
              </svg>
              Gerar agora
            </>
          )}
        </button>
      ) : (
        /* Botão flutuante (outras telas) */
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 h-11 rounded-full shadow-lg text-sm font-medium transition-all ${status === "success" ? "bg-emerald-600 text-white" :
            status === "limit" ? "bg-amber-500 text-white" :
              "bg-[#137EFF] text-white"
            }`}
        >
          {status === "success" ? (
            <>✓ Gerado!</>
          ) : status === "limit" ? (
            <>⚠️ Limite atingido</>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Gerar conteúdo
            </>
          )}
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${closing ? "animate-overlay-out" : "animate-overlay-in"}`} onClick={handleClose} />

          {/* Sheet */}
          <div
            className={`relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5 ${dragY > 0 ? "" : closing ? "animate-sheet-down" : "animate-sheet-up"
              }`}
            style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : { transition: "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)" }}
          >

            {/* Zona de arraste — handle + header */}
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className="flex flex-col gap-5 cursor-grab active:cursor-grabbing touch-none -mx-5 -mt-5 px-5 pt-5"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#333] rounded-full mx-auto -mt-1 mb-1" />

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Gerar conteúdo</h2>
                <button onClick={handleClose} className="text-[#666] hover:text-white transition-colors text-xl leading-none">✕</button>
              </div>
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
                {FORMATS.map((f) => {
                  const disabled = f.key === "carrossel" && carrosselBlocked;
                  return (
                    <button
                      key={f.key}
                      onClick={() => !disabled && setFormat(f.key)}
                      disabled={disabled}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl border text-sm font-medium transition-all ${disabled
                        ? "border-[#222] bg-[#1a1a1a] text-[#444] cursor-not-allowed"
                        : format === f.key
                          ? "border-[#137EFF] bg-[#137EFF]/10 text-white"
                          : "border-[#2e2e2e] bg-[#242424] text-[#888079]"
                        }`}
                    >
                      {f.label}
                      <span className="text-[10px] font-normal opacity-60">
                        {disabled ? (plan === "free" ? "Plano pago" : "Esgotado") : f.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Erro */}
            {status === "error" && (
              <p className="text-sm text-red-400">{message}</p>
            )}
            {status === "limit" && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex flex-col gap-1">
                <p className="text-sm text-amber-400 font-medium">⚠️ {message}</p>
                <a href="/settings/plans" className="text-xs text-amber-300 underline underline-offset-2">
                  Ver planos disponíveis →
                </a>
              </div>
            )}

            {/* Aviso de cota manual esgotada */}
            {manualExhausted && status !== "limit" && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex flex-col gap-1">
                <p className="text-sm text-amber-400 font-medium">⚠️ Você usou suas {limits.manual} {limits.manual === 1 ? "geração manual" : "gerações manuais"} desta semana.</p>
                <a href="/settings/plans" className="text-xs text-amber-300 underline underline-offset-2">
                  Renova segunda · ou faça upgrade →
                </a>
              </div>
            )}

            {/* Botão gerar */}
            <button
              onClick={handleGenerate}
              disabled={status === "loading" || manualExhausted}
              className="w-full h-12 rounded-2xl bg-[#137EFF] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
