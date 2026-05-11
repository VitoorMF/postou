import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { Category } from "@/lib/categories";

const categories: Category[] = ["novidade", "conquista", "evento", "bastidor", "dica", "parceria", "geral"];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ category: "geral" });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Você é um classificador de posts para Instagram. Sua tarefa é escolher UMA categoria para o texto.

        Categorias disponíveis:
        - novidade: lançamento de produto, serviço ou feature. Ex: "acabamos de lançar", "disponível agora", "apresentamos"
        - conquista: resultado alcançado, prêmio, meta batida. Ex: "atingimos X clientes", "fomos premiados", "aprovado em"
        - evento: acontecimento presencial ou online com data. Ex: "participe", "inscreva-se", "acontece no dia"
        - bastidor: processo interno, dia a dia, making of. Ex: "como fazemos", "nossa equipe", "por trás dos panos"
        - dica: conselho, tutorial, conteúdo educativo. Ex: "dica rápida", "como fazer", "aprenda", "saiba como"
        - parceria: colaboração com outra marca ou pessoa. Ex: "em parceria com", "junto com", "collab"
        - geral: não se encaixa em nenhuma das anteriores

        Responda APENAS com o nome da categoria, em minúsculas, sem pontuação.`,
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const raw = response.choices[0].message.content?.trim().toLowerCase() ?? "geral";
  const category = categories.includes(raw as Category) ? raw as Category : "geral";

  console.log("IA respondeu:", raw, "→ categoria:", category);
  return NextResponse.json({ category });
}
