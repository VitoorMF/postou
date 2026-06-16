"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function WaIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M317.12 285.93c-9.69 3.96-15.88 19.13-22.16 26.88-3.22 3.97-7.06 4.59-12.01 2.6-36.37-14.49-64.25-38.76-84.32-72.23-3.4-5.19-2.79-9.29 1.31-14.11 6.06-7.14 13.68-15.25 15.32-24.87 3.64-21.28-24.18-87.29-60.92-57.38C48.62 232.97 330.7 461.46 381.61 337.88c14.4-35.03-48.43-58.53-64.49-51.95zM256 467.28c-37.39 0-74.18-9.94-106.39-28.76-5.17-3.03-11.42-3.83-17.2-2.26l-69.99 19.21 24.38-53.71a22.34 22.34 0 0 0-2.22-22.32C58.5 343.29 44.71 300.61 44.71 256c0-116.51 94.78-211.29 211.29-211.29S467.28 139.49 467.28 256c0 116.5-94.78 211.28-211.28 211.28zM256 0C114.84 0 0 114.84 0 256c0 49.66 14.1 97.35 40.89 138.74L2 480.39a22.37 22.37 0 0 0 3.34 23.76A22.403 22.403 0 0 0 22.36 512c14.42 0 93.05-24.71 113.06-30.2C172.41 501.59 213.9 512 256 512c141.15 0 256-114.85 256-256C512 114.84 397.15 0 256 0z" />
    </svg>
  );
}

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={enabled}
      className={`w-[52px] h-[31px] rounded-full relative shrink-0 border transition-colors disabled:opacity-50 ${enabled ? "bg-[#137EFF] border-transparent" : "bg-[#242426] border-white/[0.12]"}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[23px] h-[23px] bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform ${enabled ? "translate-x-[21px]" : "translate-x-0"}`} />
    </button>
  );
}

interface State {
  whatsapp_number: string | null;
  whatsapp_verified: boolean;
  whatsapp_delivery_enabled: boolean;
}

export default function WhatsAppSettings() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("brand_kits")
        .select("whatsapp_number, whatsapp_verified, whatsapp_delivery_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setState(data);
      setLoading(false);
    });
  }, []);

  async function sendCode() {
    if (!phone || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setStep("code");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    if (!code || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: kit } = await supabase
          .from("brand_kits")
          .select("whatsapp_number, whatsapp_verified, whatsapp_delivery_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        if (kit) setState(kit);
      }
      setStep("phone");
      setPhone("");
      setCode("");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setVerifying(false);
    }
  }

  async function disconnect() {
    if (!confirm("Tem certeza? Você vai parar de receber os posts no WhatsApp.")) return;
    await fetch("/api/whatsapp/disconnect", { method: "POST" });
    setState({ whatsapp_number: null, whatsapp_verified: false, whatsapp_delivery_enabled: false });
  }

  async function toggleDelivery() {
    if (!state) return;
    const next = !state.whatsapp_delivery_enabled;
    setState({ ...state, whatsapp_delivery_enabled: next });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("brand_kits")
        .update({ whatsapp_delivery_enabled: next })
        .eq("user_id", user.id);
    }
  }

  const connected = state?.whatsapp_verified && state.whatsapp_number;

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto relative">
        {/* glow verde */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[480px] max-w-full h-[320px] rounded-full -z-0"
          style={{ background: "radial-gradient(closest-side, rgba(37,211,102,0.14), transparent 70%)" }} />

        <div className="relative z-10 max-w-[720px] mx-auto px-4 md:px-10 pt-12 pb-16">

          {/* back */}
          <button onClick={() => router.back()} aria-label="Voltar" className="h-11 w-11 rounded-[13px] bg-[#161618] border border-white/[0.07] flex items-center justify-center text-white hover:bg-[#262628] active:scale-95 transition-all mb-7">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* head */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-[20px] shrink-0 flex items-center justify-center text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.6)]" style={{ background: "linear-gradient(160deg,#25D366,#128C7E)" }}>
              <WaIcon size={34} />
            </div>
            <div>
              <h1 className="text-3xl md:text-[40px] font-extrabold tracking-[-0.035em] leading-none">WhatsApp</h1>
              <p className="text-[#8A8A8E] text-base font-medium mt-2">Receba seus posts direto no chat.</p>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse">
              {/* card de conexão */}
              <div className="bg-[#161618] border border-white/[0.07] rounded-[22px] p-6 mb-7">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#242426] shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 w-44 max-w-full bg-[#242426] rounded-full mb-2.5" />
                    <div className="h-4 w-32 bg-[#1e1e21] rounded-full" />
                  </div>
                </div>
                <div className="h-px bg-white/[0.07] my-5" />
                <div className="h-9 w-32 bg-[#1e1e21] rounded-xl ml-auto" />
              </div>
              {/* label + row */}
              <div className="h-3 w-20 bg-[#1e1e21] rounded-full mb-3.5 ml-1" />
              <div className="flex items-center gap-4 bg-[#161618] border border-white/[0.07] rounded-[18px] p-5">
                <div className="w-11 h-11 rounded-[13px] bg-[#242426] shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-48 max-w-full bg-[#242426] rounded-full mb-2" />
                  <div className="h-3 w-64 max-w-full bg-[#1e1e21] rounded-full" />
                </div>
                <div className="w-[52px] h-[31px] rounded-full bg-[#242426] shrink-0" />
              </div>
            </div>
          ) : connected ? (
            <>
              {/* conexão */}
              <div className="relative bg-[#161618] border border-white/[0.07] rounded-[22px] p-6 overflow-hidden mb-7">
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#25D366]" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-[#25D366] bg-[#25D366]/[0.13] border border-[#25D366]/30">
                    <WaIcon size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xl font-extrabold tracking-[-0.01em] tabular-nums">{state!.whatsapp_number}</span>
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#25D366] bg-[#25D366]/[0.13] border border-[#25D366]/30 px-2.5 py-1 rounded-full">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                        verificado
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-[#25D366] mt-1.5">
                      <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-[#25D366] opacity-50 animate-ping" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-[#25D366]" />
                      </span>
                      Conectado e recebendo
                    </div>
                  </div>
                </div>
                <div className="h-px bg-white/[0.07] my-5" />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13.5px] text-[#636366] font-medium">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
                    Recebendo seus posts
                  </span>
                  <button onClick={disconnect} className="inline-flex items-center gap-2 text-sm font-bold text-[#FF6B6B] border border-[#FF6B6B]/30 bg-[#FF6B6B]/[0.08] px-4 py-2.5 rounded-xl hover:bg-[#FF6B6B]/[0.16] active:scale-95 transition-all">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                    Desconectar
                  </button>
                </div>
              </div>

              {/* entrega */}
              <p className="text-[12.5px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3.5 ml-1">Entrega</p>
              <div className={`flex items-center gap-4 bg-[#161618] border rounded-[18px] p-5 transition-colors ${state!.whatsapp_delivery_enabled ? "border-white/[0.07]" : "border-white/[0.07]"}`}>
                <div className={`w-11 h-11 rounded-[13px] shrink-0 flex items-center justify-center border transition-colors ${state!.whatsapp_delivery_enabled ? "bg-[#25D366]/[0.13] border-[#25D366]/30 text-[#25D366]" : "bg-[#242426] border-white/[0.12] text-[#8A8A8E]"}`}>
                  <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-bold tracking-[-0.01em]">Receber posts no WhatsApp</p>
                  <p className="text-sm text-[#636366] font-medium mt-0.5 leading-snug">Toda vez que um pack for gerado, você recebe aqui.</p>
                </div>
                <Toggle enabled={state!.whatsapp_delivery_enabled} onChange={toggleDelivery} />
              </div>

              {/* nota */}
              <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 mt-5">
                <span className="w-[34px] h-[34px] rounded-[10px] shrink-0 bg-[#25D366]/[0.13] text-[#25D366] flex items-center justify-center">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </span>
                <p className="text-[13.5px] text-[#8A8A8E] leading-relaxed">As mensagens chegam do <b className="text-white font-bold">número oficial do Postou</b>. Adicione aos contatos pra não cair em spam.</p>
              </div>
            </>
          ) : (
            // ─── cadastro ───
            <div className="bg-[#161618] border border-white/[0.07] rounded-[22px] p-6 flex flex-col gap-4">
              {step === "phone" ? (
                <>
                  <div>
                    <p className="text-lg font-bold tracking-[-0.01em] mb-1">Cadastrar número</p>
                    <p className="text-sm text-[#636366] font-medium">Você vai receber um código de verificação.</p>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full bg-[#242426] border border-white/[0.12] rounded-[14px] px-4 py-3.5 text-base text-white placeholder:text-[#555] focus:outline-none focus:border-[#137EFF]/60 transition-colors"
                  />
                  {error && <p className="text-sm text-[#FF6B6B]">{error}</p>}
                  <button
                    onClick={sendCode}
                    disabled={sending || !phone}
                    className="h-12 rounded-[14px] bg-[#137EFF] text-[15px] font-bold text-white disabled:opacity-50 hover:bg-[#0f6ae0] active:scale-[0.99] transition-all"
                  >
                    {sending ? "Enviando…" : "Enviar código"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-bold tracking-[-0.01em] mb-1">Digite o código</p>
                    <p className="text-sm text-[#636366] font-medium">Enviamos um código de 6 dígitos pro seu WhatsApp.</p>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full bg-[#242426] border border-white/[0.12] rounded-[14px] px-4 py-3.5 text-2xl font-semibold tracking-[0.4em] text-center text-white placeholder:text-[#444] focus:outline-none focus:border-[#137EFF]/60 transition-colors"
                  />
                  {error && <p className="text-sm text-[#FF6B6B]">{error}</p>}
                  <button
                    onClick={verifyCode}
                    disabled={verifying || code.length !== 6}
                    className="h-12 rounded-[14px] bg-[#137EFF] text-[15px] font-bold text-white disabled:opacity-50 hover:bg-[#0f6ae0] active:scale-[0.99] transition-all"
                  >
                    {verifying ? "Verificando…" : "Confirmar"}
                  </button>
                  <button
                    onClick={() => { setStep("phone"); setCode(""); setError(null); }}
                    className="text-sm text-[#8A8A8E] hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
