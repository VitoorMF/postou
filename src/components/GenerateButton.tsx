"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getLimits } from "@/lib/plans";

type Format = "post" | "carrossel" | "story";
type Status = "idle" | "loading" | "success" | "error" | "limit";

const FORMATS: { key: Format; label: string; sub: string }[] = [
  { key: "story",    label: "Story",     sub: "1 imagem vertical" },
  { key: "post",     label: "Post",      sub: "1 imagem de destaque" },
  { key: "carrossel",label: "Carrossel", sub: "4–5 slides" },
];

export default function GenerateButton() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [theme, setTheme] = useState("");
  const [format, setFormat] = useState<Format>("story");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const router = useRouter();

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
      setStatus(res.status === 429 || res.status === 403 ? "limit" : "error");
      setMessage(data.error ?? "Erro desconhecido");
      return;
    }

    setStatus("success");
    dismiss();
    setTheme("");
    router.refresh();
    setTimeout(() => setStatus("idle"), 3000);
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


  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 h-11 rounded-full shadow-lg text-sm font-medium transition-all ${
          status === "success" ? "bg-emerald-600 text-white" :
          status === "limit"   ? "bg-amber-500 text-white" :
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${closing ? "animate-overlay-out" : "animate-overlay-in"}`} onClick={handleClose} />

          {/* Sheet */}
          <div
            className={`relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5 ${
              dragY > 0 ? "" : closing ? "animate-sheet-down" : "animate-sheet-up"
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
                      className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                        disabled
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
