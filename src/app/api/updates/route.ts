import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Category } from "@/lib/categories";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const categories: Category[] = ["novidade", "conquista", "evento", "bastidor", "dica", "parceria", "geral"];

type Nature = "temporal" | "evergreen";

async function classify(content: string): Promise<{ category: Category; nature: Nature }> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Você classifica updates de marca em DOIS eixos independentes.

        EIXO 1 — category (sobre o quê é): novidade, conquista, evento, bastidor, dica, parceria, geral.

        EIXO 2 — nature (tem prazo de validade?):
        - temporal: acontecimento pontual com data. Vira notícia UMA vez e depois envelhece. Ex: "lancei o site", "palestrei hoje", "fechei um cliente", "artigo compartilhado 500x"
        - evergreen: fato perene, observação ou reflexão sem data. Continua útil indefinidamente. Ex: "14 anos de carreira", "produtores travam ao falar em público"

        Os eixos são independentes: uma "conquista" pode ser temporal (prêmio recebido ontem) ou evergreen (anos de experiência). Decida nature pela existência de uma data por trás, não pela category.

        Responda APENAS em JSON, sem markdown: {"category":"...","nature":"temporal"|"evergreen"}`,
      },
      { role: "user", content },
    ],
  });

  const raw = res.choices[0].message.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      category: categories.includes(parsed.category) ? parsed.category : "geral",
      nature: parsed.nature === "temporal" ? "temporal" : "evergreen",
    };
  } catch {
    return { category: "geral", nature: "evergreen" };
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

// Quando a anotação vem de uma pergunta do Bibliotecário, a resposta sozinha
// perde o contexto ("Foi no RS" não diz do quê). Sintetiza pergunta + resposta
// num FATO declarativo e autossuficiente — vira matéria-prima limpa pro pipeline.
async function synthesizeFact(question: string, answer: string): Promise<string | null> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Você transforma um par PERGUNTA + RESPOSTA numa única anotação declarativa e factual sobre a marca, autossuficiente (faz sentido sozinha, sem a pergunta).
Regras: use SÓ o que está na resposta (e o contexto da pergunta); NUNCA invente fatos, números ou nomes que não foram ditos; se a resposta for vaga, mantenha vaga. 1 a 2 frases naturais em português. Não repita a pergunta, não use formato de Q&A.
Exemplo: P "Qual o lugar mais longe onde já deu palestra?" R "campo de pesquisa do RS" → "A palestra mais distante que já demos foi no campo de pesquisa do Rio Grande do Sul."
Responda só com a anotação, sem aspas e sem markdown.`,
        },
        { role: "user", content: `PERGUNTA: ${question}\nRESPOSTA: ${answer}` },
      ],
    });
    return res.choices[0].message.content?.trim() || null;
  } catch (err) {
    console.error("Erro ao sintetizar anotação:", err);
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { content, photo_urls, prompt } = await request.json();
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "Conteúdo muito longo (máx. 5000 caracteres)" }, { status: 400 });
  if (typeof prompt === "string" && prompt.length > 500) return NextResponse.json({ error: "Pergunta inválida" }, { status: 400 });

  // Veio de uma pergunta do Bibliotecário → sintetiza pergunta+resposta num fato
  // limpo (senão a resposta sozinha perde o contexto). Falha na síntese → usa a
  // resposta crua (degrada sem quebrar).
  let finalContent = content.trim();
  if (typeof prompt === "string" && prompt.trim()) {
    finalContent = (await synthesizeFact(prompt.trim(), finalContent)) ?? finalContent;
  }

  // Busca o brand_kit do usuário autenticado — não confia no client
  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const [classification, embedding] = await Promise.all([
    classify(finalContent),
    generateEmbedding(finalContent),
  ]);

  const admin = createAdminClient();
  const { error } = await admin.from("updates").insert({
    user_id: user.id,
    brand_kit_id: kit?.id ?? null,
    content: finalContent,
    category: classification.category,
    nature: classification.nature,
    photo_urls: photo_urls ?? null,
    embedding,
  });

  if (error) {
    console.error("Erro ao salvar update:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}