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

  // Dispara geração pra cada brand kit em paralelo
  const results = await Promise.allSettled(
    brandKits.map((kit: { id: string }) =>
      fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization satisfaz o gateway de JWT do Supabase (porta de entrada do generate-pack).
          "Authorization": `Bearer ${serviceKey}`,
          // X-Internal-Secret é validado pelo handler do generate-pack (lógica interna).
          "X-Internal-Secret": internalSecret,
        },
        body: JSON.stringify({ brand_kit_id: kit.id }),
      }).then((r) => r.json())
    )
  );

  return new Response(
    JSON.stringify({ processed: brandKits.length, results }),
    { headers: { "Content-Type": "application/json" } }
  );
});