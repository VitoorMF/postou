"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const selectedPlan = plans.find((p) => p.id === selected);
  const isPaid = selectedPlan?.priceNum !== null;
  const isCurrentPlan = selected === currentPlan;

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

    </div>
  );
}
