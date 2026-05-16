import OpenAI from "openai";
import type { Category } from "@/lib/categories";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const categories: Category[] = ["novidade", "conquista", "evento", "bastidor", "dica", "parceria", "geral"];

export async function classify(content: string): Promise<Category> {
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

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}
