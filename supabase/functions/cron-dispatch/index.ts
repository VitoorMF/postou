import { createClient } from "npm:@supabase/supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Valida secret pra evitar chamadas não autorizadas
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Busca brand kits que precisam gerar agora
  const { data: brandKits, error } = await supabaseAdmin.rpc("get_brand_kits_to_generate");

  if (error) {
    console.error("Erro ao buscar brand kits:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!brandKits || brandKits.length === 0) {
    return new Response(JSON.stringify({ message: "Nenhum brand kit para gerar agora." }));
  }

  const generateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-pack`;
  const internalSecret = Deno.env.get("INTERNAL_SECRET") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Busca packs failed de hoje para retry
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: failedPacks } = await supabaseAdmin
    .from("packs")
    .select("brand_kit_id")
    .eq("status", "failed")
    .gte("created_at", todayStart.toISOString());

  const failedKitIds = new Set((failedPacks ?? []).map((p: { brand_kit_id: string }) => p.brand_kit_id));

  // Une brand kits novos + retries de failed
  const allKitIds = new Set([
    ...(brandKits as { id: string }[]).map((k) => k.id),
    ...failedKitIds,
  ]);

  // Dispara geração pra cada brand kit sem aguardar resposta (fire-and-forget)
  for (const kitId of allKitIds) {
    fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({ brand_kit_id: kitId }),
    }).catch((err) => console.error(`Erro ao disparar kit ${kitId}:`, err));
  }

  return new Response(
    JSON.stringify({ dispatched: allKitIds.size, retries: failedKitIds.size }),
    { headers: { "Content-Type": "application/json" } }
  );
});