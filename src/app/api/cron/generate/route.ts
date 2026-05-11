import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  // Verifica o secret para evitar chamadas não autorizadas
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Busca brand kits cujo delivery_time está na janela dos últimos 15 minutos
  // e ainda não geraram pack hoje
  const { data: brandKits, error } = await supabase.rpc("get_brand_kits_to_generate");

  if (error) {
    console.error("Erro ao buscar brand kits:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!brandKits || brandKits.length === 0) {
    return NextResponse.json({ message: "Nenhum brand kit para gerar agora." });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const results = await Promise.allSettled(
    brandKits.map((kit: { id: string }) =>
      fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_kit_id: kit.id }),
      }).then((r) => r.json())
    )
  );

  return NextResponse.json({ processed: brandKits.length, results });
}
