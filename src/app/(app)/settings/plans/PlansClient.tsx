"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ⚠️ Os limites REAIS são aplicados em supabase/functions/generate-pack/index.ts
// (objeto LIMITS). Este array é só o texto exibido — mantenha em sincronia.
const plans = [
  {
    id: "free",
    name: "Free",
    price: "Grátis",
    priceNum: null as number | null,
    features: [
      "1 geração automática por semana",
      "1 geração manual por semana",
      "Post e story (sem carrossel)",
      "1 brand kit",
    ],
    highlight: false,
    badge: null as string | null,
  },
  {
    id: "starter",
    name: "Starter",
    price: "R$ 39",
    priceNum: 39,
    features: [
      "3 gerações automáticas por semana",
      "2 gerações manuais por semana",
      "Carrossel 1x por semana",
      "IA decide o melhor formato",
      "1 brand kit",
    ],
    highlight: true,
    badge: "MAIS ESCOLHIDO",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 89",
    priceNum: 89,
    features: [
      "Gerações ilimitadas",
      "Todos os dias da semana",
      "Carrossel sem limite semanal",
      "Geração manual ilimitada",
      "IA decide o melhor formato",
    ],
    highlight: false,
    badge: null as string | null,
  },
];

export default function PlansClient({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentPlan);
  const [showCpf, setShowCpf] = useState(false);
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = plans.find((p) => p.id === selected);
  const isPaid = selectedPlan?.priceNum !== null;
  const isCurrentPlan = selected === currentPlan;

  // Formata CPF enquanto digita: 000.000.000-00
  function maskCpf(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, cpf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar");
        setLoading(false);
        return;
      }
      // redireciona pra página de pagamento do Asaas (Pix + cartão)
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 pt-12 pb-4 shrink-0">
        <button onClick={() => router.back()} className="h-9 w-9 rounded-full bg-[#1c1c1c] flex items-center justify-center mb-4">
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-3xl font-semibold">Planos</h1>
        <p className="text-base text-[#888079]">Escolha um plano pra seguir gerando</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4 max-w-4xl mx-auto w-full">

        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          const isCurrent = plan.id === currentPlan;

          return (
            <div key={plan.id} className="relative">
              {plan.badge && (
                <div className="absolute -top-3 left-4 z-10">
                  <span className="text-[10px] font-bold tracking-widest bg-[#e8d5b7] text-black px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <button
                onClick={() => setSelected(plan.id)}
                className={`w-full text-left bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3 border-2 transition-colors ${
                  isCurrent
                    ? "border-[#137EFF] bg-[#0d1a2e]"
                    : isSelected
                    ? "border-[#137EFF]"
                    : "border-transparent"
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        plano atual
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[#888079]">
                    {plan.priceNum === null
                      ? <span className="text-lg font-bold text-white">Grátis</span>
                      : <><span className="text-lg font-bold text-white">{plan.price}</span> /mês</>
                    }
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" stroke="#137EFF" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-[#ccc]">{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            </div>
          );
        })}

        <p className="text-center text-xs text-[#555] py-1">cobrado mensalmente · cancele a qualquer hora</p>

      </div>

      <div className="px-4 py-3 shrink-0 max-w-4xl mx-auto w-full">
        <button
          onClick={() => setShowCpf(true)}
          className="w-full h-14 rounded-full bg-[#137EFF] text-base font-semibold disabled:opacity-40"
          disabled={!isPaid || isCurrentPlan}
        >
          {isCurrentPlan
            ? "Você já está neste plano"
            : !isPaid
            ? "Você já está no plano gratuito"
            : `Assinar ${selectedPlan?.name} — ${selectedPlan?.price}/mês`}
        </button>
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
              <p className="text-xs text-[#555]">Necessário pra gerar a cobrança (Pix ou cartão). Você escolhe a forma de pagamento na próxima tela.</p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={loading || cpf.replace(/\D/g, "").length !== 11}
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

    </div>
  );
}
