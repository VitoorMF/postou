import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { updateSubscriptionValue } from "@/lib/asaas";

// Valor do Starter — deve bater com PLAN_VALUES (checkout) e VALUE_TO_PLAN (webhook).
const STARTER_VALUE = 39;

// Downgrade Pro → Starter: muda o valor da assinatura Asaas pra R$39.
// NÃO rebaixa o plano agora — o cliente fica Pro até plan_expires_at; na próxima
// cobrança de R$39 o webhook (VALUE_TO_PLAN) seta plan='starter' sozinho.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("users")
    .select("asaas_subscription_id, plan, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!row || row.plan !== "pro" || !row.asaas_subscription_id) {
    return NextResponse.json({ error: "Downgrade disponível apenas para assinantes Pro." }, { status: 400 });
  }

  try {
    await updateSubscriptionValue(row.asaas_subscription_id, STARTER_VALUE);
  } catch (e) {
    console.error("Erro ao fazer downgrade no Asaas:", e);
    return NextResponse.json({ error: "Não foi possível fazer o downgrade agora. Tente de novo." }, { status: 502 });
  }

  // marca o estado pra UI lembrar do downgrade após reload (limpo quando o pagamento de R$39 aplica o starter)
  await admin.from("users").update({ plan_change: "downgrade" }).eq("id", user.id);

  return NextResponse.json({ ok: true, plan_expires_at: row.plan_expires_at });
}
