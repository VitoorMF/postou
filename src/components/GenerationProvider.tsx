"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Format = "post" | "story" | "carrossel";
type GenState = "idle" | "generating" | "success" | "error" | "limit";

interface GenContext {
  state: GenState;
  generate: (opts: { format: Format; theme?: string; images?: string[]; usePersona?: boolean }) => void;
}

const Ctx = createContext<GenContext | null>(null);

export function useGeneration() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGeneration precisa estar dentro de GenerationProvider");
  return c;
}

export default function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GenState>("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const generate = useCallback(({ format, theme, images, usePersona }: { format: Format; theme?: string; images?: string[]; usePersona?: boolean }) => {
    // dispara em background — não bloqueia a UI; o banner mostra o progresso
    setState("generating");
    setMessage("");

    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setState("error"); setMessage("Não autenticado"); return; }

        const { data: kit } = await supabase.from("brand_kits").select("id").eq("user_id", user.id).maybeSingle();
        if (!kit) { setState("error"); setMessage("Brand kit não encontrado"); return; }

        const { data: { session } } = await supabase.auth.getSession();
        const body: Record<string, unknown> = { brand_kit_id: kit.id, force_type: format };
        if (theme?.trim()) {
          body.theme_override = theme.trim();
          body.use_persona = !!usePersona; // só faz sentido com tema (geração manual pula o planner)
        }
        if (images && images.length) body.image_urls = images;

        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setState(res.status === 429 || res.status === 403 ? "limit" : "error");
          setMessage(data.error ?? "Erro ao gerar");
          setTimeout(() => setState("idle"), 6000);
          return;
        }

        setState("success");
        router.refresh();
        setTimeout(() => setState("idle"), 3000);
      } catch {
        setState("error");
        setMessage("Erro de conexão");
        setTimeout(() => setState("idle"), 6000);
      }
    })();
  }, [router]);

  return (
    <Ctx.Provider value={{ state, generate }}>
      {children}
      {state !== "idle" && (
        <div className="fixed inset-x-0 bottom-24 md:bottom-6 z-[60] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#1c1c1e]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] pl-4 pr-5 py-3.5 animate-fade-in max-w-[92vw]">
            {state === "generating" && (
              <>
                <svg className="animate-spin shrink-0" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#137EFF" strokeWidth="3" />
                  <path className="opacity-90" fill="#137EFF" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">Gerando seu conteúdo…</p>
                  <p className="text-xs text-[#8A8A8E] mt-0.5">Fica pronto em alguns minutos. Pode continuar usando o app.</p>
                </div>
              </>
            )}
            {state === "success" && (
              <>
                <span className="h-6 w-6 rounded-full bg-[#30C46B]/20 grid place-items-center shrink-0">
                  <svg width="14" height="14" fill="none" stroke="#30C46B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <p className="text-sm font-bold text-white">Conteúdo pronto! ✨</p>
              </>
            )}
            {(state === "error" || state === "limit") && (
              <>
                <span className="h-6 w-6 rounded-full bg-amber-500/20 grid place-items-center shrink-0">
                  <svg width="14" height="14" fill="none" stroke="#f5a524" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">{message || "Algo deu errado"}</p>
                  {state === "limit" && <a href="/settings/plans" className="text-xs text-amber-300 underline underline-offset-2">Ver planos →</a>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
