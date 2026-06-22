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

export type Intent = "update" | "rating" | "question";

// Roteia a mensagem que o dono manda no WhatsApp: anotar / avaliar o post / dúvida.
export async function classifyIntent(
  message: string,
): Promise<{ intent: Intent; sentiment?: "positive" | "negative" }> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Você roteia mensagens que o DONO de um negócio manda no WhatsApp da ferramenta Postou (que gera posts pra ele e entrega ali). Classifique em UMA intenção:

- "update": ele conta um FATO/novidade do NEGÓCIO pra virar conteúdo. Ex: "fechei um cliente hoje", "lançamos um produto", "tenho 14 anos de experiência", "palestrei num evento".
- "rating": ele está AVALIANDO o ÚLTIMO POST que recebeu da ferramenta. Ex: "gostei", "amei esse", "ficou ótimo", "não curti", "tá ruim", "esse não", "👍", "👎". Inclua "sentiment".
- "question": ele faz uma PERGUNTA ou pede AJUDA sobre a ferramenta/uso. Ex: "como funciona?", "como mudo o horário?", "preciso de ajuda", "não recebi meu post".

REGRA: "rating" é só sobre o POST que ele recebeu. Elogio/crítica ao próprio NEGÓCIO é "update". Na dúvida entre update e rating, escolha "update".

Responda APENAS em JSON, sem markdown: {"intent":"update|rating|question","sentiment":"positive|negative"}
("sentiment" só quando intent="rating")`,
        },
        { role: "user", content: message },
      ],
    });
    const parsed = JSON.parse((res.choices[0].message.content ?? "{}").replace(/```json|```/g, "").trim());
    const intent: Intent = (["update", "rating", "question"] as const).includes(parsed.intent)
      ? parsed.intent
      : "update";
    const sentiment =
      parsed.sentiment === "negative" ? "negative" : parsed.sentiment === "positive" ? "positive" : undefined;
    return { intent, sentiment };
  } catch {
    return { intent: "update" }; // fallback seguro: comportamento atual (trata como update)
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}
