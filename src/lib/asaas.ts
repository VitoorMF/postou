const BASE = process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3";

function getKey() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY ausente");
  return key;
}

async function call<T = unknown>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: getKey(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Asaas ${path} falhou: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}

// ─── Customers ──────────────────────────────────────────────────────────────

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}): Promise<AsaasCustomer> {
  return call<AsaasCustomer>("/customers", { method: "POST", body: input });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  status: string;
}

export async function createSubscription(input: {
  customer: string;            // id do customer Asaas
  value: number;               // valor mensal
  description: string;
  nextDueDate: string;         // YYYY-MM-DD (1ª cobrança)
  externalReference?: string;  // nosso user_id, pra rastrear no webhook
}): Promise<AsaasSubscription> {
  return call<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: {
      customer: input.customer,
      billingType: "UNDEFINED",  // deixa o cliente escolher Pix ou cartão na página
      value: input.value,
      cycle: "MONTHLY",
      nextDueDate: input.nextDueDate,
      description: input.description,
      externalReference: input.externalReference,
    },
  });
}

interface AsaasPayment {
  id: string;
  invoiceUrl: string;   // página hospedada de pagamento (Pix QR + cartão)
  status: string;
  value: number;
}

// Pega os pagamentos de uma assinatura (usado pra obter o invoiceUrl da 1ª cobrança)
export async function getSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  const res = await call<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
  return res.data ?? [];
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await call(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}
