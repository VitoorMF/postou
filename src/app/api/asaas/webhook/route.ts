import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// valor → plano
const VALUE_TO_PLAN: Record<number, string> = {
  39: "starter",
  89: "pro",
};

export async function POST(request: Request) {
  // ─── Segurança: valida o token que o Asaas envia no header ───
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const received = request.headers.get("asaas-access-token");
  if (expected && received !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const event = payload.event as string;
  const payment = payload.payment as {
    externalReference?: string;
    value?: number;
    status?: string;
  } | undefined;

  if (!payment?.externalReference) return NextResponse.json({ ok: true });

  const userId = payment.externalReference;
  const admin = createAdminClient();

  // Pagamento confirmado/recebido → ativa ou renova o plano
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    const plan = VALUE_TO_PLAN[Math.round(payment.value ?? 0)] ?? "starter";

    // vale por ~32 dias (buffer pra timing da cobrança mensal não cortar o acesso)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 32);

    // Verifica o plano atual: se MUDOU (upgrade), zera os contadores como brinde.
    // Se for renovação do mesmo plano, mantém (o reset semanal cuida disso).
    const { data: current } = await admin
      .from("users")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const isUpgrade = current?.plan !== plan;

    const patch: Record<string, unknown> = {
      plan,
      plan_expires_at: expiresAt.toISOString(),
      plan_change: null, // pagamento confirmou → mudança pendente (cancel/downgrade) foi aplicada/renovada
    };
    if (isUpgrade) {
      patch.weekly_auto_count = 0;
      patch.weekly_manual_count = 0;
      patch.weekly_carrossel_count = 0;
      patch.week_start_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await admin.from("users").update(patch).eq("id", userId);

    if (error) console.error("Erro ao ativar plano:", error);
  }

  // Pagamento atrasado/estornado → o cron de expiração cuida do downgrade
  // (não rebaixa aqui na hora pra dar margem do cliente pagar em atraso)

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
