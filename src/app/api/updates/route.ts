import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Category } from "@/lib/categories";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const categories: Category[] = ["novidade", "conquista", "evento", "bastidor", "dica", "parceria", "geral"];

async function classify(content: string): Promise<Category> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Você é um classificador de posts para Instagram. Escolha UMA categoria: novidade, conquista, evento, bastidor, dica, parceria, geral. Responda APENAS o nome, em minúsculas.`,
      },
      { role: "user", content },
    ],
  });
  const raw = res.choices[0].message.content?.trim().toLowerCase() ?? "geral";
  return categories.includes(raw as Category) ? (raw as Category) : "geral";
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { content, photo_urls } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });

  // Busca o brand_kit do usuário autenticado — não confia no client
  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const [category, embedding] = await Promise.all([
    classify(content),
    generateEmbedding(content),
  ]);

  const admin = createAdminClient();
  const { error } = await admin.from("updates").insert({
    user_id: user.id,
    brand_kit_id: kit?.id ?? null,
    content: content.trim(),
    category,
    photo_urls: photo_urls ?? null,
    embedding,
  });

  if (error) {
    console.error("Erro ao salvar update:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
