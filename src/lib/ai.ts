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

// ─── Agente do WhatsApp ───────────────────────────────────────────────────────

export type WaIntent = "update" | "rating" | "generate" | "question" | "smalltalk" | "clarify";

export interface WaAgentResult {
  intent: WaIntent;
  reply: string;
  sentiment?: "positive" | "negative";
  theme?: string;
  category?: Category;
}

const WA_AGENT_PROMPT = `Você é o assistente do Postou no WhatsApp. Tom: simpático, brasileiro, direto e com leveza — emoji com moderação. Respostas CURTAS (é WhatsApp).

[O QUE É O POSTOU]
Uma IA que aprende a marca do negócio e gera posts, stories e carrosséis pro Instagram automaticamente — e entrega aqui no WhatsApp, prontos pra publicar. O dono só publica.

[O QUE O DONO PODE FAZER AQUI NO WHATSAPP]
- Contar uma NOVIDADE/fato do negócio → vira conteúdo.
- AVALIAR o último post que recebeu (gostei / não curti).
- PEDIR um post na hora: ex. "Gerar agora <tema>" ou "faz um post sobre X".

[NO APP — use isto pra responder "como faço…". O app fica em https://postou.app]
- Hoje (https://postou.app/hoje): painel inicial — status do dia, gerações usadas na semana e o próximo post automático agendado.
- Configurar (https://postou.app/settings): horário de entrega, dias da semana, o que gerar (deixar a IA escolher ou fixar post/story/carrossel) e conectar/verificar o WhatsApp (https://postou.app/settings/whatsapp).
- Brand Kit (https://postou.app/settings/brand-kit): logo, paleta de cores, personas/rostos da marca, tom de voz, "sobre a marca" e restrições do que a IA não deve fazer.
- Anotações (https://postou.app/feed): adicionar novidades e contexto da marca (também dá pra mandar por aqui).
- Conteúdo (https://postou.app/content): ver, compartilhar, baixar, marcar como postado e avaliar 👍/👎 os posts gerados.
- Planos (https://postou.app/settings/plans): Free (1 post automático + 1 manual por semana, sem carrossel), Starter (3 automáticos, 2 manuais e 1 carrossel por semana), Pro (posta todo dia, 14 manuais e 4 carrosséis por semana).
- Não souber responder algo específico? Direcione pro suporte: suporte@postou.app.

[SUA TAREFA]
Leia a mensagem do dono, escolha UMA intenção e escreva uma "reply" curta e simpática (pt-BR):
- "update": ele conta um fato/novidade do NEGÓCIO. Inclua "category" (novidade|conquista|evento|bastidor|dica|parceria|geral). reply: confirma que anotou e que vira post.
- "rating": ele avalia o ÚLTIMO POST recebido (gostei/amei/não curti/ficou ruim/👍/👎). Inclua "sentiment". reply: agradece o feedback.
- "generate": ele pede pra criar um post E disse o tema. Inclua "theme". reply: curtinho (ex: "Boa! Já te pergunto o formato 👇"). Se ele pedir pra gerar mas NÃO disser o tema, use "clarify" e pergunte sobre o quê.
- "question": dúvida sobre o uso/app. reply: RESPONDA de verdade usando o que você sabe acima; se não souber, mande pro suporte.
- "smalltalk": saudação/agradecimento/conversa ("oi", "bom dia", "obrigado", "👋"). reply: cumprimenta e orienta o que dá pra fazer aqui.
- "clarify": a mensagem é AMBÍGUA — poderia ser 2+ intenções (ex: novidade OU pedido de geração). reply: pergunte, de forma simpática, o que ele quis.

REGRA DE OURO: havendo dúvida real entre duas intenções (ex: update vs generate), use "clarify" e PERGUNTE — não chute. Elogio ao próprio NEGÓCIO é "update"; elogio ao POST recebido é "rating".

LINKS: quando orientar uma ação que é feita no app (mudar horário, ajustar marca, ver planos, etc.), INCLUA o link direto da seção na reply (ex: "é em Configurar 👉 https://postou.app/settings"). Use com parcimônia — só quando ajudar o usuário a chegar lá, nunca em toda mensagem.

CONTINUIDADE: se vier uma "Conversa recente" (últimos minutos), use-a pra dar seguimento. Ex: se VOCÊ acabou de perguntar algo (clarify) e o dono responde curto ("gerar", "o segundo", "dia das mães"), interprete a resposta à luz da SUA pergunta — não trate como mensagem solta.

Responda APENAS em JSON, sem markdown:
{"intent":"...","reply":"...","sentiment":"positive|negative","theme":"...","category":"..."}
(inclua só os campos que fizerem sentido pra intenção)`;

// Uma chamada: entende a mensagem, escolhe a intenção e já escreve a resposta.
// O webhook executa a ação (anotar/avaliar/gerar) com base no intent.
export async function whatsappAgent(message: string, history?: string): Promise<WaAgentResult> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5, // um pouco de carisma, mas controlado
      messages: [
        { role: "system", content: WA_AGENT_PROMPT },
        ...(history ? [{ role: "system" as const, content: `Conversa recente (mesma sessão):\n${history}` }] : []),
        { role: "user", content: message },
      ],
    });
    const parsed = JSON.parse((res.choices[0].message.content ?? "{}").replace(/```json|```/g, "").trim());
    const valid: WaIntent[] = ["update", "rating", "generate", "question", "smalltalk", "clarify"];
    const intent: WaIntent = valid.includes(parsed.intent) ? parsed.intent : "smalltalk";
    return {
      intent,
      reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : "Recebi! 🙂",
      sentiment: parsed.sentiment === "negative" ? "negative" : parsed.sentiment === "positive" ? "positive" : undefined,
      theme: typeof parsed.theme === "string" && parsed.theme.trim() ? parsed.theme.trim() : undefined,
      category: categories.includes(parsed.category) ? (parsed.category as Category) : undefined,
    };
  } catch {
    // falha do modelo → não toma ação errada, só pede pra repetir
    return { intent: "clarify", reply: "Ops, não consegui processar agora 😅 manda de novo?" };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}
