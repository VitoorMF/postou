"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 149",
    features: ["1 post OU 1 story por dia", "Até 3 dias/semana", "1 brand kit"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 349",
    features: ["Carrossel + post + story, todo dia", "Todos os dias da semana", "3 brand kits", "Revisão editorial humana"],
    highlight: true,
    badge: "MAIS ESCOLHIDO",
  },
];

export default function Plans() {
  const router = useRouter();
  const [selected, setSelected] = useState("pro");

  const selectedPlan = plans.find((p) => p.id === selected);
  const hasPrice = selectedPlan && selectedPlan.price !== "sob consulta";

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

        <div className="bg-[#1c1c1c] rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          <p className="text-sm text-white">Trial termina em <span className="font-semibold">6 dias</span></p>
        </div>

        {plans.map((plan) => {
          const isSelected = selected === plan.id;
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
                className={`w-full text-left bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3 border-2 transition-colors ${isSelected && plan.highlight ? "border-blue-600 bg-[#1a1500]" : isSelected ? "border-[#137EFF]" : "border-transparent"}`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold">{plan.name}</span>
                  <span className="text-sm text-[#888079]">
                    {plan.price === "sob consulta"
                      ? <span className="text-lg font-bold text-white">sob consulta</span>
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
        <button className="w-full h-14 rounded-full bg-[#137EFF] text-base font-semibold">
          {hasPrice ? `Assinar ${selectedPlan.name} — ${selectedPlan.price}/mês` : "Falar com vendas"}
        </button>
      </div>

    </div>
  );
}
