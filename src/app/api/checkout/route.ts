import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createCustomer, createSubscription, getSubscriptionPayments } from "@/lib/asaas";

const PLAN_VALUES: Record<string, { value: number; label: string }> = {
  starter: { value: 39, label: "Postou Starter" },
  pro:     { value: 89, label: "Postou Pro" },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { plan, cpf } = await request.json();
  const planInfo = PLAN_VALUES[plan];
  if (!planInfo) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const cleanCpf = String(cpf ?? "").replace(/\D/g, "");
  if (cleanCpf.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Busca dados do usuário + nome da marca
  const [{ data: userRow }, { data: kit }] = await Promise.all([
    admin.from("users").select("asaas_customer_id").eq("id", user.id).maybeSingle(),
    admin.from("brand_kits").select("business_name, whatsapp_number").eq("user_id", user.id).maybeSingle(),
  ]);

  try {
    // 1. Reusa o customer Asaas se já existir, senão cria
    let customerId = userRow?.asaas_customer_id;
    if (!customerId) {
      const customer = await createCustomer({
        name: kit?.business_name ?? user.email ?? "Cliente Postou",
        email: user.email ?? "",
        cpfCnpj: cleanCpf,
        mobilePhone: kit?.whatsapp_number ?? undefined,
      });
      customerId = customer.id;
      await admin.from("users").update({ asaas_customer_id: customerId }).eq("id", user.id);
    }

    // 2. Cria a assinatura mensal (1ª cobrança amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDueDate = tomorrow.toISOString().split("T")[0];

    const subscription = await createSubscription({
      customer: customerId,
      value: planInfo.value,
      description: planInfo.label,
      nextDueDate,
      externalReference: user.id, // o webhook usa isso pra saber de quem é
    });

    await admin.from("users").update({ asaas_subscription_id: subscription.id }).eq("id", user.id);

    // 3. Pega a página de pagamento da 1ª cobrança
    const payments = await getSubscriptionPayments(subscription.id);
    const invoiceUrl = payments[0]?.invoiceUrl;
    if (!invoiceUrl) {
      return NextResponse.json({ error: "Não foi possível gerar a cobrança" }, { status: 500 });
    }

    return NextResponse.json({ url: invoiceUrl });
  } catch (err) {
    console.error("Erro no checkout Asaas:", err);
    return NextResponse.json({ error: "Erro ao criar cobrança" }, { status: 500 });
  }
}
