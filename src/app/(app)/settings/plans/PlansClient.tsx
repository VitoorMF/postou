"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ⚠️ Os limites REAIS são aplicados em supabase/functions/generate-pack/index.ts
// (objeto LIMITS). Este array é só o texto exibido — mantenha em sincronia.
const plans = [
  {
    id: "free",
    name: "Free",
    tag: "Pra experimentar o ritmo.",
    price: "R$ 39",
    priceNum: null as number | null,
    note: "Pra sempre, sem cartão.",
    features: [
      "1 geração automática por semana",
      "1 geração manual por semana",
      "Post e story (sem carrossel)",
      "1 brand kit",
    ],
    featured: false,
    badge: null as string | null,
    // ordem: mobile mostra Starter primeiro; desktop Free → Starter → Pro
    order: "order-3 md:order-1",
  },
  {
    id: "starter",
    name: "Starter",
    tag: "Pra quem posta toda semana.",
    price: "R$ 39",
    priceNum: 39,
    note: "cobrado mensalmente",
    features: [
      "3 gerações automáticas por semana",
      "2 gerações manuais por semana",
      "Carrossel 1× por semana",
      "A IA decide o melhor formato",
      "1 brand kit",
    ],
    featured: true,
    badge: "Mais escolhido",
    order: "order-1 md:order-2",
  },
  {
    id: "pro",
    name: "Pro",
    tag: "Pra escalar sem freio.",
    price: "R$ 89",
    priceNum: 89,
    note: "cobrado mensalmente",
    features: [
      "Posta todos os dias da semana",
      "14 gerações manuais por semana",
      "4 carrosséis por semana",
      "A IA decide o melhor formato",
      "Suporte prioritário no WhatsApp",
    ],
    featured: false,
    badge: null as string | null,
    order: "order-2 md:order-3",
  },
];

export default function PlansClient({ currentPlan, planExpiresAt }: { currentPlan: string; planExpiresAt?: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentPlan);
  const [showCpf, setShowCpf] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cancelamento de assinatura (modal)
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelledUntil, setCancelledUntil] = useState<string | null>(null);

  const currentPlanName = plans.find((p) => p.id === currentPlan)?.name ?? "seu plano";

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch("/api/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCancelledUntil(data.plan_expires_at ?? planExpiresAt ?? null);
      } else {
        setCancelError(data.error ?? "Não foi possível cancelar.");
      }
    } catch {
      setCancelError("Erro de conexão.");
    } finally {
      setCancelling(false);
    }
  }

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : "";

  const selectedPlan = plans.find((p) => p.id === selected);

  function maskCpf(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function isValidCpf(value: string) {
    const cpf = value.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    const d = cpf.split("").map(Number);
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += d[i] * (10 - i);
    let check = (sum * 10) % 11;
    if (check === 10) check = 0;
    if (check !== d[9]) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += d[i] * (11 - i);
    check = (sum * 10) % 11;
    if (check === 10) check = 0;
    return check === d[10];
  }

  const cpfDigits = cpf.replace(/\D/g, "");
  const cpfInvalid = cpfDigits.length === 11 && !isValidCpf(cpf);

  function openCheckout(planId: string) {
    setSelected(planId);
    setError("");
    setShowCpf(true);
  }

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, cpf, name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto relative">
        {/* glow ambiente */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] max-w-full h-[420px] rounded-full -z-0"
          style={{ background: "radial-gradient(closest-side, rgba(19,126,255,0.15), transparent 70%)" }} />

        <div className="relative z-10 max-w-[1180px] mx-auto px-4 md:px-14 pt-12 pb-16">

          {/* top */}
          <div className="mb-9">
            <button onClick={() => router.back()} aria-label="Voltar" className="h-11 w-11 rounded-[13px] bg-[#161618] border border-white/[0.07] flex items-center justify-center text-white hover:bg-[#262628] active:scale-95 transition-all">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          </div>

          {/* head */}
          <div className="text-center mb-9">
            <p className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#137EFF] mb-3">Planos</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Poste mais. Pense menos.</h1>
            <p className="text-[#8A8A8E] text-base md:text-lg font-medium mt-4 max-w-md mx-auto">Escolha um plano e deixe a IA cuidar do seu conteúdo todos os dias.</p>
          </div>

          {/* plans */}
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isPaid = plan.priceNum !== null;
              const isFree = !isPaid;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[24px] p-7 ${plan.order} ${
                    plan.featured
                      ? "border border-[#137EFF]/50 bg-gradient-to-b from-[#137EFF]/[0.08] to-[#161618] shadow-[0_30px_70px_-28px_rgba(19,126,255,0.45)] md:-translate-y-2.5"
                      : "border border-white/[0.07] bg-[#161618]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-to-b from-[#3b76ff] to-[#137EFF] text-white text-[11.5px] font-extrabold tracking-wide uppercase px-3.5 py-1.5 rounded-full shadow-[0_10px_24px_-8px_rgba(19,126,255,0.7)] whitespace-nowrap">
                      <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9.91 8.26 3 9l5 4.87L6.18 21 12 17.77 17.82 21 16 13.87 21 9l-6.91-.74Z" /></svg>
                      {plan.badge}
                    </div>
                  )}

                  {/* name */}
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-xl font-extrabold tracking-[-0.02em]">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[11px] font-bold text-[#30C46B] bg-[#30C46B]/[0.14] border border-[#30C46B]/30 px-2.5 py-0.5 rounded-md whitespace-nowrap">plano atual</span>
                    )}
                  </div>
                  <p className="text-sm text-[#8A8A8E] font-medium mb-5 min-h-[20px]">{plan.tag}</p>

                  {/* price */}
                  <div className="flex items-end gap-1.5 mb-1.5">
                    {isFree ? (
                      <span className="text-[44px] font-extrabold tracking-[-0.04em] leading-none bg-gradient-to-br from-white to-[#9bb6ff] bg-clip-text text-transparent">Grátis</span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-[#8A8A8E] mb-1.5">R$</span>
                        <span className="text-[48px] font-extrabold tracking-[-0.04em] leading-none">{plan.priceNum}</span>
                        <span className="text-[15px] text-[#636366] font-semibold mb-2">/mês</span>
                      </>
                    )}
                  </div>
                  <p className="text-[13px] text-[#636366] font-medium mb-6 min-h-[18px]">{plan.note}</p>

                  <div className="h-px bg-white/[0.07] mb-5" />

                  {/* features */}
                  <ul className="flex flex-col gap-3.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] text-[#D6D6D8] font-medium leading-snug">
                        <span className="w-[21px] h-[21px] rounded-full bg-[#137EFF]/[0.16] text-[#137EFF] flex items-center justify-center shrink-0 mt-px">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <button disabled className="w-full h-[52px] rounded-[14px] border border-white/[0.12] bg-transparent text-[#8A8A8E] text-[15.5px] font-bold flex items-center justify-center cursor-default">
                        Seu plano atual
                      </button>
                      {/* link de cancelar só no plano pago atual */}
                      {!isFree && (cancelledUntil ? (
                        <span className="text-[12.5px] text-[#30C46B] font-semibold">Cancelada · ativa até {fmtDate(cancelledUntil)}</span>
                      ) : (
                        <button onClick={() => { setCancelError(""); setShowCancel(true); }} className="text-[13px] text-[#636366] hover:text-[#FF6B6B] font-semibold transition-colors">
                          Cancelar assinatura
                        </button>
                      ))}
                    </div>
                  ) : isFree ? (
                    // Card Free com usuário num plano pago → voltar ao free (= cancelar)
                    cancelledUntil ? (
                      <div className="h-[52px] rounded-[14px] bg-[#30C46B]/[0.12] border border-[#30C46B]/30 text-[#30C46B] text-[13px] font-semibold flex items-center justify-center text-center px-3 leading-tight">
                        Cancelada · ativa até {fmtDate(cancelledUntil)}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setCancelError(""); setShowCancel(true); }}
                        className="h-[52px] rounded-[14px] bg-[#262628] text-white text-[15.5px] font-bold flex items-center justify-center hover:bg-[#303033] active:scale-[0.98] transition-all"
                      >
                        Voltar ao Free
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => openCheckout(plan.id)}
                      className={`h-[52px] rounded-[14px] text-[15.5px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                        plan.featured || plan.id === "pro"
                          ? "bg-[#137EFF] text-white shadow-[0_12px_30px_-10px_rgba(19,126,255,0.7)] hover:bg-[#0f6ae0]"
                          : "bg-[#262628] text-white hover:bg-[#303033]"
                      }`}
                    >
                      {plan.id === "pro" && (
                        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" /></svg>
                      )}
                      Assinar {plan.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* footer trust */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-9 text-sm text-[#636366] font-medium">
            <span className="flex items-center gap-2">
              <svg width="15" height="15" fill="none" stroke="#48484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Pagamento seguro
            </span>
            <span className="w-1 h-1 rounded-full bg-[#48484A]" />
            <span className="flex items-center gap-2">
              <svg width="15" height="15" fill="none" stroke="#48484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 9 16 9" /></svg>
              Cancele a qualquer hora
            </span>
            <span className="w-1 h-1 rounded-full bg-[#48484A]" />
            <span className="flex items-center gap-2">
              <svg width="15" height="15" fill="none" stroke="#48484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              7 dias de reembolso
            </span>
          </div>

        </div>
      </div>

      {/* Modal CPF */}
      {showCpf && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setShowCpf(false)} />
          <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5 animate-sheet-up">
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto -mt-1 mb-1" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Assinar {selectedPlan?.name}</h2>
              <button onClick={() => !loading && setShowCpf(false)} className="text-[#666] hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#555] tracking-widest">NOME COMPLETO</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do titular do CPF"
                className="w-full bg-[#242424] text-white text-sm rounded-xl px-4 h-11 placeholder:text-[#444] outline-none focus:ring-1 focus:ring-[#137EFF]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#555] tracking-widest">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full bg-[#242424] text-white text-sm rounded-xl px-4 h-11 placeholder:text-[#444] outline-none focus:ring-1 focus:ring-[#137EFF]"
              />
              {cpfInvalid
                ? <p className="text-xs text-red-400">CPF inválido — confira os números.</p>
                : <p className="text-xs text-[#555]">Necessário pra gerar a cobrança (Pix ou cartão). Você escolhe a forma de pagamento na próxima tela.</p>
              }
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={loading || !isValidCpf(cpf) || fullName.trim().length < 3}
              className="w-full h-12 rounded-2xl bg-[#137EFF] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Gerando cobrança...
                </>
              ) : (
                `Ir para pagamento — ${selectedPlan?.price}/mês`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Cancelamento */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !cancelling && setShowCancel(false)} />
          <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5 animate-sheet-up">
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto -mt-1 mb-1" />

            {cancelledUntil ? (
              // ─── Sucesso ───
              <>
                <div className="flex flex-col items-center gap-3 text-center py-2">
                  <span className="h-14 w-14 rounded-full bg-[#30C46B]/15 grid place-items-center">
                    <svg width="28" height="28" fill="none" stroke="#30C46B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <h2 className="text-lg font-bold text-white">Assinatura cancelada</h2>
                  <p className="text-sm text-[#8A8A8E] leading-relaxed">
                    Você continua no <b className="text-white">{currentPlanName}</b> até <b className="text-white">{fmtDate(cancelledUntil)}</b>. Depois disso, sua conta volta para o plano Free.
                  </p>
                </div>
                <button onClick={() => setShowCancel(false)} className="w-full h-12 rounded-2xl bg-[#137EFF] text-white text-sm font-semibold">
                  Entendi
                </button>
              </>
            ) : (
              // ─── Confirmação ───
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Cancelar assinatura?</h2>
                  <button onClick={() => !cancelling && setShowCancel(false)} className="text-[#666] hover:text-white transition-colors text-xl leading-none">✕</button>
                </div>

                <div className="bg-[#202022] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5 text-sm text-[#aaa] leading-snug">
                  <p>• Você <b className="text-white">continua com o {currentPlanName}</b>{planExpiresAt ? <> até <b className="text-white">{fmtDate(planExpiresAt)}</b></> : ""} — nada muda até lá.</p>
                  <p>• A cobrança <b className="text-white">não será renovada</b>.</p>
                  <p>• No vencimento, sua conta volta para o <b className="text-white">plano Free</b> (1 post automático e 1 manual por semana, sem carrossel).</p>
                </div>

                {cancelError && <p className="text-sm text-red-400">{cancelError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancel(false)}
                    disabled={cancelling}
                    className="flex-1 h-12 rounded-2xl bg-[#262628] text-white text-sm font-semibold hover:bg-[#303033] disabled:opacity-50 transition-colors"
                  >
                    Manter assinatura
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 h-12 rounded-2xl bg-[#FF6B6B]/[0.14] border border-[#FF6B6B]/40 text-[#FF6B6B] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FF6B6B]/[0.22] disabled:opacity-50 transition-colors"
                  >
                    {cancelling ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Cancelando…
                      </>
                    ) : "Sim, cancelar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
