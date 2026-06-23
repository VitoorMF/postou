// ROTEIRISTAS — escrevem a COPY (o texto que vai na arte). Um por formato, porque
// post/story (imagem única) e carrossel (série) têm regras de estrutura bem
// diferentes. Recebem o arquétipo já decidido (ou null, quando o usuário deu um
// tema manual e a estrutura vem do próprio tema). generateCaption escreve a
// legenda num passo à parte, lendo o texto que já vai na arte.

import { type Archetype } from "./archetypes.ts";
import { COPY_MODEL, type Mode, openai } from "./shared.ts";

type WriterUpdate = { id: string; created_at: string; category: string; content: string };

export type WriterArgs = {
  brandKit: Record<string, unknown>;
  updates: WriterUpdate[];
  mode: Mode;
  themeOverride?: string;
  archetype: Archetype | null;
};

export type GeneratedPack = {
  title: string;
  slides: { order: number; role?: string; content: string }[];
};

// ─── Blocos de prompt reaproveitados ──────────────────────────────────────────

function buildTaskBlock(type: string, mode: Mode, themeOverride?: string): string {
  if (themeOverride) {
    return `Gere um ${type} para Instagram sobre o TEMA SOLICITADO acima.

Regras obrigatórias:
- O conteúdo deve girar em torno do TEMA SOLICITADO pelo usuário
- Use os RECENT UPDATES como contexto adicional, apenas se forem relacionados ao tema
- Mantenha a DESCRIPTION, tom de voz e identidade da marca`;
  }
  if (mode === "evento") {
    return `Gere um ${type} para Instagram sobre o acontecimento real dos RECENT UPDATES.

Regras obrigatórias:
- O post é sobre uma novidade verdadeira: uma conquista, lançamento, evento ou parceria recente
- O tom é de rotina: uma empresa compartilhando o que aconteceu
- NÃO crie posts genéricos de apresentação da marca ou propaganda
- Use a DESCRIPTION e BRAND MEMORY apenas para ajustar o tom e a voz, não como assunto`;
  }
  return `Gere um ${type} de CONTEÚDO para Instagram com base nos RECENT UPDATES como contexto da marca.

Regras obrigatórias:
- PROIBIDO tratar isto como novidade ou anúncio
- PROIBIDO usar expressões como "novidade", "agora tenho", "estou animada para compartilhar", "acabei de", "lançamento", "novo"
- Isto é conteúdo de valor: uma dica prática, uma reflexão, um bastidor ou uma pergunta para a audiência
- Os RECENT UPDATES são fatos perenes da marca, NÃO acontecimentos novos a serem anunciados
- Use a DESCRIPTION e BRAND MEMORY para ajustar o tom e a voz`;
}

// Com arquétipo: estrutura fechada. Sem arquétipo (manual com tema): deriva do tema.
function buildArchetypeBlock(type: string, archetype: Archetype | null): string {
  if (archetype) {
    return `[ARQUÉTIPO DEFINIDO]
Estruture o conteúdo como ${archetype.label}: ${archetype.instruction}`;
  }
  return type === "carrossel"
    ? `[ESTRUTURA]
Derive a estrutura do próprio TEMA SOLICITADO, desdobrando-o em 4-5 slides que se complementam.`
    : `[ESTRUTURA]
Derive a estrutura do próprio TEMA SOLICITADO. Resolva em UMA imagem: evite passo a passo longo, mas um conjunto curto (2-3 itens) é ok se o tema pedir.`;
}

function updatesText(updates: WriterUpdate[]): string {
  return updates.length > 0
    ? updates.map((u) => {
      const date = new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `${date} — ${u.category}: ${u.content}`;
    }).join("\n")
    : "Nenhum update registrado. Baseie-se apenas na descrição da marca.";
}

const SINGLE_STRUCTURE = `Responda APENAS em JSON, sem markdown.

{
  "title": "título do pack",
  "slides": [
    { "order": 1, "content": "texto do slide" }
  ]
}

Retorne apenas 1 slide (sem campo role).`;

const CARROSSEL_STRUCTURE = `Responda APENAS em JSON, sem markdown.

{
  "title": "título do pack",
  "slides": [
    { "order": 1, "role": "hook", "content": "texto do slide 1" }
  ]
}

Retorne entre 4 e 5 slides seguindo esta estrutura obrigatória:
- Slide 1: role "hook" — frase de impacto que para o scroll, apresenta o tema
- Slides intermediários: role "body" — cada um desenvolve um ponto específico, conteúdo informativo e conciso
- Último slide: role "cta" — chamada para ação clara, encoraja comentário, salvamento ou contato

NÚMERO COERENTE: se o título/capa prometer uma quantidade ("N dicas", "N erros", "N passos"), N DEVE ser EXATAMENTE o número de slides de CORPO (body) — NÃO conte a capa nem o CTA. Com 5 slides (1 capa + 3 corpo + 1 CTA) → o número é 3. Com 4 slides (1 capa + 2 corpo + 1 CTA) → é 2. Cada slide de corpo entrega UM item. NUNCA prometa mais itens do que há slides de corpo.

Exemplo:
{ "order": 1, "role": "hook", "content": "texto do hook" }
{ "order": 2, "role": "body", "content": "ponto 1" }
{ "order": 5, "role": "cta", "content": "texto do cta" }`;

function composePrompt(args: WriterArgs, type: string, structureBlock: string): string {
  const { brandKit, updates, mode, themeOverride, archetype } = args;
  const themeBlock = themeOverride ? `\n[TEMA SOLICITADO PELO USUÁRIO]\n${themeOverride}\n` : "";

  return `Você é um especialista em marketing de conteúdo para Instagram.

[DESCRIPTION]
${brandKit.description ?? "Empresa sem descrição cadastrada."}
Tom de voz: ${brandKit.voice_tone ?? "neutro"}

[BRAND MEMORY]
${brandKit.context ?? "Sem histórico acumulado ainda."}

[RECENT UPDATES]
${updatesText(updates)}
${themeBlock}
[DO NOT DO]
${brandKit.do_not_do ?? "Nenhuma restrição cadastrada."}

[TAREFA]
${buildTaskBlock(type, mode, themeOverride)}

${buildArchetypeBlock(type, archetype)}

${structureBlock}`;
}

async function runWriter(prompt: string): Promise<GeneratedPack | null> {
  const response = await openai.chat.completions.create({
    model: COPY_MODEL,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = response.choices[0].message.content?.trim() ?? "";
  try {
    return JSON.parse(raw) as GeneratedPack;
  } catch {
    return null;
  }
}

// ─── Os três roteiristas ──────────────────────────────────────────────────────

export function writePost(args: WriterArgs) {
  return runWriter(composePrompt(args, "post", SINGLE_STRUCTURE));
}

export function writeStory(args: WriterArgs) {
  return runWriter(composePrompt(args, "story", SINGLE_STRUCTURE));
}

export function writeCarousel(args: WriterArgs) {
  return runWriter(composePrompt(args, "carrossel", CARROSSEL_STRUCTURE));
}

// Despacha pro roteirista certo conforme o formato.
export function write(type: string, args: WriterArgs) {
  if (type === "carrossel") return writeCarousel(args);
  if (type === "story") return writeStory(args);
  return writePost(args);
}

// ─── Legenda ──────────────────────────────────────────────────────────────────

// Gera a LEGENDA num passo separado, lendo o texto que JÁ vai na arte (slides) —
// assim a legenda complementa a imagem por construção, em vez de repetir.
export async function generateCaption(
  type: string,
  title: string,
  slides: { content: string }[],
  brandKit: Record<string, unknown>,
): Promise<{ caption: string; cta: string | null }> {
  const imageText = slides.map((s) => s.content).filter(Boolean).join("\n");

  const prompt = `Você escreve legendas de Instagram para a marca abaixo.

[MARCA]
Descrição: ${brandKit.description ?? "—"}
Tom de voz: ${brandKit.voice_tone ?? "neutro"}

[DO NOT DO]
${brandKit.do_not_do ?? "Nenhuma restrição."}

[POST]
Tipo: ${type}
Título: ${title}
Texto que JÁ está na ARTE (a legenda deve COMPLEMENTAR, NUNCA repetir isto):
${imageText || "—"}

Escreva a LEGENDA do Instagram + um CTA curto, em português, no tom da marca.
A legenda COMPLEMENTA a arte — acrescenta contexto, história, exemplo ou provocação e puxa engajamento. NÃO descreva nem repita o que já está na imagem.
QUEBRE em PARÁGRAFOS CURTOS (nada de bloco único): uma linha em branco entre cada parágrafo. Estrutura típica: gancho na 1ª frase, 1-2 parágrafos de desenvolvimento, e um fecho. Escape as quebras como \\n\\n dentro do JSON.
Responda APENAS em JSON, sem markdown: {"caption":"gancho\\n\\ndesenvolvimento\\n\\nfecho","cta":"..."}`;

  try {
    const res = await openai.chat.completions.create({
      model: COPY_MODEL,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse((res.choices[0].message.content ?? "{}").replace(/```json|```/g, "").trim());
    return {
      caption: String(parsed.caption ?? "").trim(),
      cta: parsed.cta ? String(parsed.cta).trim() : null,
    };
  } catch (err) {
    console.error("Erro ao gerar legenda:", err);
    return { caption: "", cta: null };
  }
}
