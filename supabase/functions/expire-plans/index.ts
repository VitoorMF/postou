import { createClient } from "npm:@supabase/supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Reverte para "free" quem está num plano pago com a validade vencida.
// O webhook do Asaas empurra plan_expires_at +32d a cada pagamento confirmado;
// então quem PAGA sempre tem vencimento no futuro. Quem PAROU de pagar ou
// CANCELOU (e o período acabou) vence → este cron rebaixa. Roda 1×/dia.
Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data: expired, error } = await supabaseAdmin
    .from("users")
    .select("id, plan, plan_expires_at")
    .neq("plan", "free")
    .lt("plan_expires_at", nowIso);

  if (error) {
    console.error("Erro ao buscar planos vencidos:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ message: "Nenhum plano vencido." }), { headers: { "Content-Type": "application/json" } });
  }

  const ids = (expired as { id: string }[]).map((u) => u.id);

  // Rebaixa pra free. Não zera os contadores: se o usuário já estourou o limite
  // free nesta semana, fica bloqueado até o reset semanal (comportamento correto).
  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ plan: "free", plan_expires_at: null })
    .in("id", ids);

  if (upErr) {
    console.error("Erro ao rebaixar planos vencidos:", upErr);
    return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
  }

  console.log(`Planos vencidos rebaixados para free: ${ids.length}`, ids);
  return new Response(JSON.stringify({ downgraded: ids.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
