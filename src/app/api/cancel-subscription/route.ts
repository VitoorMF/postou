import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { cancelSubscription } from "@/lib/asaas";

// Cancela a assinatura no Asaas (para de renovar). O plano NÃO é rebaixado aqui:
// o cliente usa até plan_expires_at; o cron expire-plans reverte pra free no vencimento.
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

  if (!row || row.plan === "free" || !row.asaas_subscription_id) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa para cancelar." }, { status: 400 });
  }

  try {
    await cancelSubscription(row.asaas_subscription_id);
  } catch (e) {
    console.error("Erro ao cancelar assinatura no Asaas:", e);
    return NextResponse.json({ error: "Não foi possível cancelar agora. Tente de novo." }, { status: 502 });
  }

  // marca o estado pra UI lembrar do cancelamento após reload (limpo no próximo pagamento)
  await admin.from("users").update({ plan_change: "cancel" }).eq("id", user.id);

  return NextResponse.json({ ok: true, plan_expires_at: row.plan_expires_at });
}
