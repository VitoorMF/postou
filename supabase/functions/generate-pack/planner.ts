// DIRETOR — decide a ESTRATÉGIA do post: o tema, se a persona aparece e (quando
// a marca deixa a IA escolher) o formato. NÃO escreve a copy nem decide o
// arquétipo — o arquétipo (estrutura) é rotacionado por código em archetypes.ts,
// de propósito, pra garantir variedade e não viciar no ângulo mais óbvio.

import { COPY_MODEL, type Mode, openai } from "./shared.ts";
import { toneGuide } from "./tone.ts";

export async function planTheme(
  brandKit: Record<string, unknown>,
  samples: { category: string; content: string }[],
  recentTitles: string[],
  hasPersona: boolean,
  mode: Mode,
  aiDecideType: boolean,
  carrosselAvailable: boolean,
  dateHint: string,
): Promise<{ theme: string; use_persona: boolean; type?: string }> {
  const samplesText = samples.map((u) => `- ${u.category}: ${u.content.slice(0, 80)}`).join("\n");

  const avoidText = recentTitles.length > 0
    ? `\nTemas já usados recentemente (NÃO repita nem temas similares):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const personaInstruction = hasPersona
    ? `A marca tem fotos da persona disponíveis. Decida se faz sentido ela aparecer neste post. Use persona em posts pessoais (bastidor, conquista, evento). Não use em dados técnicos ou parcerias entre marcas.`
    : `A marca não tem persona cadastrada. use_persona deve ser false.`;

  // Evergreen: em vez de "inventar um tema" genérico, transforma o que a marca FAZ
  // numa fonte de assuntos específicos (dúvidas reais, erros comuns, decisões…).
  const modeInstruction = mode === "evento"
    ? `Os updates abaixo são acontecimentos recentes e reais da marca. Escolha o mais interessante para virar um post de novidade.`
    : `NÃO há nenhum acontecimento novo disponível. Sua missão é transformar o que ESTA marca faz numa fonte de assuntos úteis e específicos para o público dela.

1. A partir da DESCRIÇÃO/serviços da marca (e dos updates abaixo como contexto), pense internamente em ~10 temas possíveis: dúvidas reais do público, erros comuns que as pessoas cometem, decisões difíceis, "o que saber antes de…", bastidores, comparações. Específicos do que esta marca de fato faz — NADA de marketing genérico ("a importância de…", "por que nos escolher", "qualidade e confiança").
2. Descarte qualquer tema parecido com os já usados.
3. Escolha UM tema específico, útil e não-óbvio — evite sempre o ângulo mais batido.

O tema NÃO pode ser um anúncio e NÃO pode fingir que algo acabou de acontecer.`;

  const typeInstruction = aiDecideType
    ? `
Você também deve decidir o FORMATO ideal para este conteúdo seguindo esta hierarquia obrigatória:
- "story" é o padrão — use sempre que o conteúdo for simples, cotidiano ou evergreen
- "post" apenas quando houver uma conquista ou novidade relevante que justifique destaque
${carrosselAvailable
        ? `- "carrossel" quando o tema pedir explicação em série — assuntos que se desdobram em vários pontos (um conceito explicado, passo a passo, dúvidas frequentes). Também para evento importante ou lançamento. Use com parcimônia.`
        : `- "carrossel" NÃO está disponível agora — escolha apenas entre "story" e "post".`}

Adicione "type": ${carrosselAvailable ? `"story" | "post" | "carrossel"` : `"story" | "post"`} no JSON de resposta.`
    : "";

  const res = await openai.chat.completions.create({
    model: COPY_MODEL,
    temperature: mode === "evergreen" ? 0.9 : 0.7,
    messages: [{
      role: "user",
      content: `Você é um estrategista de conteúdo para Instagram.
Marca: ${brandKit.business_name ?? ""}
Descrição: ${brandKit.description ?? ""}
Tom de voz: ${toneGuide(brandKit.voice_tone as string | null)}

Updates disponíveis:
${samplesText}
${avoidText}

${modeInstruction}
${dateHint ? `\n[DATA COMEMORATIVA]\n${dateHint}\n` : ""}
${personaInstruction}
${typeInstruction}

Responda APENAS em JSON: {"theme": "tema em 1 frase curta", "use_persona": true ou false${aiDecideType ? `, "type": ${carrosselAvailable ? `"story" | "post" | "carrossel"` : `"story" | "post"`}` : ""}}`,
    }],
  });

  const fallbackTheme = mode === "evento" ? "novidade da marca" : "bastidor da marca";
  try {
    const parsed = JSON.parse(res.choices[0].message.content?.trim() ?? "{}");
    return {
      theme: parsed.theme ?? fallbackTheme,
      use_persona: hasPersona ? (parsed.use_persona ?? false) : false,
      type: aiDecideType ? (parsed.type ?? "story") : undefined,
    };
  } catch {
    return { theme: fallbackTheme, use_persona: false, type: aiDecideType ? "story" : undefined };
  }
}
