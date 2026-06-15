import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Regenera SÓ a legenda + CTA (texto, barato). Mantém a imagem/título.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: pack } = await admin
    .from("packs")
    .select("id, user_id, title, type, caption")
    .eq("id", id)
    .single();
  if (!pack || pack.user_id !== user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const { data: kit } = await admin
    .from("brand_kits")
    .select("business_name, description, voice_tone, do_not_do")
    .eq("user_id", user.id)
    .maybeSingle();

  const prompt = `Você escreve legendas de Instagram para a marca abaixo.

[MARCA]
Nome: ${kit?.business_name ?? "—"}
Descrição: ${kit?.description ?? "—"}
Tom de voz: ${kit?.voice_tone ?? "neutro"}

[NÃO FAZER]
${kit?.do_not_do ?? "Nenhuma restrição."}

[POST]
Tipo: ${pack.type}
Tema/título: ${pack.title}
Legenda atual (gere algo DIFERENTE desta): ${pack.caption ?? "—"}

Escreva uma NOVA legenda criativa e um CTA curto, em português, no tom da marca.
Responda APENAS em JSON, sem markdown: {"caption":"...","cta":"..."}`;

  let caption = "";
  let cta: string | null = null;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse((res.choices[0].message.content ?? "{}").replace(/```json|```/g, "").trim());
    caption = String(parsed.caption ?? "").trim();
    cta = parsed.cta ? String(parsed.cta).trim() : null;
  } catch (e) {
    console.error("Erro ao regenerar legenda:", e);
    return NextResponse.json({ error: "Falha ao gerar" }, { status: 500 });
  }

  if (!caption) return NextResponse.json({ error: "Falha ao gerar" }, { status: 500 });

  const { error } = await admin.from("packs").update({ caption, cta }).eq("id", id);
  if (error) {
    console.error("Erro ao salvar legenda:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  return NextResponse.json({ caption, cta });
}
