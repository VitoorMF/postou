import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { toneGuide } from "@/lib/tone";

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

  // Texto que está NA arte — pra legenda complementar, não repetir
  const { data: slidesData } = await admin
    .from("slides")
    .select("content")
    .eq("pack_id", id)
    .order("order");
  const imageText = (slidesData ?? [])
    .map((s) => (s as { content: string | null }).content)
    .filter(Boolean)
    .join("\n");

  const prompt = `Você escreve legendas de Instagram para a marca abaixo.

[MARCA]
Nome: ${kit?.business_name ?? "—"}
Descrição: ${kit?.description ?? "—"}
Tom de voz: ${toneGuide(kit?.voice_tone)}

[NÃO FAZER]
${kit?.do_not_do ?? "Nenhuma restrição."}

[POST]
Tipo: ${pack.type}
Tema/título: ${pack.title}
Texto que JÁ está na imagem (a legenda deve COMPLEMENTAR, NUNCA repetir isto): ${imageText || "—"}
Legenda atual (gere algo DIFERENTE desta): ${pack.caption ?? "—"}

Escreva uma NOVA legenda criativa e um CTA curto, em português, no tom da marca.
A legenda deve COMPLEMENTAR a arte (que já mostra o conceito visualmente) — acrescente contexto, história ou provocação e puxe engajamento; não descreva nem repita o que já está na imagem.
QUEBRE em PARÁGRAFOS CURTOS (nada de bloco único): uma linha em branco entre cada parágrafo. Estrutura típica: gancho na 1ª frase, 1-2 parágrafos de desenvolvimento, e um fecho. Escape as quebras como \\n\\n dentro do JSON.
Responda APENAS em JSON, sem markdown: {"caption":"gancho\\n\\ndesenvolvimento\\n\\nfecho","cta":"..."}`;

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
