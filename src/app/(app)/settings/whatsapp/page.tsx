"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 disabled:opacity-50 ${enabled ? "bg-[#137EFF]" : "bg-[#3a3a3a]"}`}
    >
      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-[-2px]" : "translate-x-[-22px]"}`} />
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

  // form de cadastro
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
      // recarrega state
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

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="h-9 w-9 rounded-full bg-[#1c1c1c] flex items-center justify-center mb-4">
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-3xl font-semibold">WhatsApp</h1>
        <p className="text-base text-[#888079]">Receba seus posts direto no chat.</p>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 flex flex-col gap-4 pb-4 max-w-4xl mx-auto w-full">

          {loading ? (
            <div className="bg-[#1c1c1c] rounded-2xl p-4 animate-pulse h-32" />
          ) : state?.whatsapp_verified && state.whatsapp_number ? (
            // ─── Estado: conectado ───
            <>
              <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 512 512" fill="#25D366">
                      <path d="M317.12 285.93c-9.69 3.96-15.88 19.13-22.16 26.88-3.22 3.97-7.06 4.59-12.01 2.6-36.37-14.49-64.25-38.76-84.32-72.23-3.4-5.19-2.79-9.29 1.31-14.11 6.06-7.14 13.68-15.25 15.32-24.87 3.64-21.28-24.18-87.29-60.92-57.38C48.62 232.97 330.7 461.46 381.61 337.88c14.4-35.03-48.43-58.53-64.49-51.95zM256 467.28c-37.39 0-74.18-9.94-106.39-28.76-5.17-3.03-11.42-3.83-17.2-2.26l-69.99 19.21 24.38-53.71a22.34 22.34 0 0 0-2.22-22.32C58.5 343.29 44.71 300.61 44.71 256c0-116.51 94.78-211.29 211.29-211.29S467.28 139.49 467.28 256c0 116.5-94.78 211.28-211.28 211.28zM256 0C114.84 0 0 114.84 0 256c0 49.66 14.1 97.35 40.89 138.74L2 480.39a22.37 22.37 0 0 0 3.34 23.76A22.403 22.403 0 0 0 22.36 512c14.42 0 93.05-24.71 113.06-30.2C172.41 501.59 213.9 512 256 512c141.15 0 256-114.85 256-256C512 114.84 397.15 0 256 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium">{state.whatsapp_number}</p>
                    <p className="text-sm text-[#16a34a]">Conectado e verificado</p>
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="text-sm text-[#ff6b6b] self-start hover:text-[#ff9b9b] transition-colors"
                >
                  Desconectar
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#555] tracking-widest">ENTREGA</p>
                <div className="bg-[#1c1c1c] rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium">Receber posts no WhatsApp</p>
                    <p className="text-sm text-[#888079]">Toda vez que um pack for gerado, você recebe aqui.</p>
                  </div>
                  <Toggle enabled={state.whatsapp_delivery_enabled} onChange={toggleDelivery} />
                </div>
              </div>
            </>
          ) : (
            // ─── Estado: cadastro ───
            <div className="bg-[#1c1c1c] rounded-2xl p-5 flex flex-col gap-4">
              {step === "phone" ? (
                <>
                  <div>
                    <p className="text-base font-medium mb-1">Cadastrar número</p>
                    <p className="text-sm text-[#888079]">Você vai receber um código de verificação.</p>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="bg-[#242424] rounded-xl px-4 py-3 text-base text-white placeholder:text-[#555] focus:outline-none"
                  />
                  {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
                  <button
                    onClick={sendCode}
                    disabled={sending || !phone}
                    className="h-11 rounded-full bg-[#137EFF] text-sm font-medium text-white disabled:opacity-50"
                  >
                    {sending ? "Enviando…" : "Enviar código"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-base font-medium mb-1">Digite o código</p>
                    <p className="text-sm text-[#888079]">Enviamos um código de 6 dígitos pro seu WhatsApp.</p>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="bg-[#242424] rounded-xl px-4 py-3 text-2xl font-semibold tracking-[0.4em] text-center text-white placeholder:text-[#555] focus:outline-none"
                  />
                  {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
                  <button
                    onClick={verifyCode}
                    disabled={verifying || code.length !== 6}
                    className="h-11 rounded-full bg-[#137EFF] text-sm font-medium text-white disabled:opacity-50"
                  >
                    {verifying ? "Verificando…" : "Confirmar"}
                  </button>
                  <button
                    onClick={() => { setStep("phone"); setCode(""); setError(null); }}
                    className="text-sm text-[#888079] hover:text-white transition-colors"
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
