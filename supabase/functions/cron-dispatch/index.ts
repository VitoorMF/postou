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

  // Dispara geração pra cada brand kit em paralelo
  const results = await Promise.allSettled(
    brandKits.map((kit: { id: string }) =>
      fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
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
