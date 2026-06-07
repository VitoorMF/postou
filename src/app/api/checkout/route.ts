import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createCustomer, createSubscription, getSubscriptionPayments } from "@/lib/asaas";

const PLAN_VALUES: Record<string, { value: number; label: string }> = {
  starter: { value: 39, label: "Postou Starter" },
  pro:     { value: 89, label: "Postou Pro" },
};

// Valida CPF pelo dígito verificador (não só o tamanho)
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  // rejeita sequências iguais (000..., 111..., etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  // 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== digits[9]) return false;

  // 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== digits[10]) return false;

  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { plan, cpf, name } = await request.json();
  const planInfo = PLAN_VALUES[plan];
  if (!planInfo) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const cleanCpf = String(cpf ?? "").replace(/\D/g, "");
  if (!isValidCpf(cleanCpf)) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const fullName = String(name ?? "").trim();
  if (fullName.length < 3) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
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
        name: fullName,
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
