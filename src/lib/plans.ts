// ⚠️ Estes limites devem espelhar o objeto LIMITS em
// supabase/functions/generate-pack/index.ts (fonte da verdade server-side).
// Aqui é só pra UX (desabilitar botões antes do clique).

export type PlanId = "free" | "starter" | "pro";

export interface PlanLimits {
  auto: number;
  manual: number;
  carrossel: number;
}

export const LIMITS: Record<PlanId, PlanLimits> = {
  free:    { auto: 1, manual: 1, carrossel: 0 },
  starter: { auto: 3, manual: 2, carrossel: 1 },
  pro:     { auto: Infinity, manual: Infinity, carrossel: Infinity },
};

export function getLimits(plan: string | null | undefined): PlanLimits {
  return LIMITS[(plan as PlanId)] ?? LIMITS.free;
}
