import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// BIBLIOTECÁRIO em modo CURADORIA ATIVA: olha o acervo (updates), percebe o buraco
// e devolve UMA pergunta pro dono preencher — que vira anotação nova no feed.
// Cacheado na marca (brand_kits.suggested_prompt) e regenerado no máx. 1x/24h ou
// sob ?force=1 (chamado após o dono responder) — pra não queimar LLM a cada load.

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STALE_MS = 24 * 60 * 60 * 1000;

// Cold-start / fallback: marca nova (sem updates) ou LLM falhou → pergunta curada.
const CURATED = [
  "Rolou alguma novidade no seu negócio essa semana?",
  "Tem algum bastidor do dia a dia que valeria a pena mostrar?",
  "Qual dica você daria pro seu cliente hoje?",
  "Fechou algum cliente ou teve alguma conquista recente pra comemorar?",
  "Tem algum produto ou serviço que merece um destaque?",
];
const curated = () => CURATED[Math.floor(Math.random() * CURATED.length)];

type Kit = {
  business_name: string | null;
  description: string | null;
  voice_tone: string | null;
  suggested_prompt: string | null;
};
type Upd = { category: string; content: string };

async function generateQuestion(kit: Kit, rows: Upd[]): Promise<string | null> {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const countStr = Object.entries(counts).map(([c, n]) => `${c}: ${n}`).join(", ") || "vazio";
  const recent = rows.slice(0, 10).map((r) => `[${r.category}] ${String(r.content).slice(0, 200)}`).join("\n");

  const sys = `Você é o "Bibliotecário" de uma marca — o agente que cuida do acervo de anotações que alimentam o conteúdo dela nas redes.

Seu acervo são as anotações que o dono já registrou. Agora você faz CURADORIA ATIVA: olha o que já tem, percebe o que FALTA, e faz UMA pergunta pro dono pra arrancar dele uma anotação nova e específica.

QUEM RESPONDE — leia isto antes de tudo: imagine o dono típico deste negócio — ocupado, mais velho, pouco íntimo de tecnologia. Ele NÃO sabe "o que dá um bom post" e CONGELA diante de pergunta aberta. Se você perguntar "tem algum bastidor curioso ou rotina especial?", ele pensa "ai, o que eu boto aqui?" e desiste. Se você perguntar algo concreto que ele sabe de cor, ele responde na hora. (Essa persona é só uma referência mental SUA — nunca a mencione nem invente nome de pessoa na pergunta; a pergunta é dirigida ao dono real da marca.)

REGRA DE OURO: a pergunta precisa ter uma RESPOSTA FACTUAL que o dono dá SEM PENSAR. Pergunte sobre uma COISA específica e concreta (o produto que mais vende, um número, um nome, o que rolou hoje), NUNCA sobre uma CATEGORIA abstrata ("bastidor", "rotina", "algo interessante", "uma novidade"). Pergunte como um CLIENTE CURIOSO puxando papo — não como um social media pedindo "conteúdo".

Exemplos (negócio de comida):
- RUIM ❌ "Tem algum bastidor curioso ou rotina especial da cozinha pra dividir?" (abstrato → ela trava)
- BOM ✅ "Qual é o salgado que mais sai aí? Tem algum segredinho no preparo que deixa ele diferente?" (factual → ela responde na hora: "coxinha, e a massa leva batata pra ficar leve")
- RUIM ❌ "Que novidade tem no negócio essa semana?"
- BOM ✅ "Vi que vocês estavam contratando cozinheira — já acharam alguém?"

Como montar:
- Olhe o acervo e ache o tema/categoria AUSENTE ou fraco (categorias só pra enxergar o buraco: novidade, conquista, evento, bastidor, dica, parceria, geral).
- Transforme esse buraco numa pergunta CONCRETA, ancorada no ramo da marca (comida tem prato campeão, ingrediente, receita; loja tem o mais vendido; serviço tem cliente/caso real).
- Pode abrir com uma observação curtíssima do acervo, mas a pergunta em si tem que ser respondível de cabeça.
- Curta (máx 2 frases), tom de voz da marca, PT-BR, calorosa. Emoji pontual ok.
- NÃO repita temas das anotações recentes nem a última pergunta.

Responda APENAS em JSON, sem markdown: {"prompt":"sua pergunta aqui"}`;

  const userMsg = `Marca: ${kit.business_name ?? "—"}
Sobre: ${kit.description ?? "—"}
Tom de voz: ${kit.voice_tone ?? "—"}

Distribuição das anotações por categoria: ${countStr}

Anotações recentes (mais novas primeiro):
${recent}

Última pergunta feita (NÃO repita): ${kit.suggested_prompt ?? "nenhuma"}`;

  try {
    const res = await openai.chat.completions.create({
      // gpt-4.1 (mesmo modelo da copy): a pergunta é o "gancho" da feature, vale a
      // qualidade. Frequência baixíssima (1x/24h por marca + 1 por resposta) → custo irrelevante.
      model: "gpt-4.1",
      temperature: 0.8,
      messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
    });
    const raw = res.choices[0].message.content?.trim() ?? "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const p = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
    return p || null;
  } catch (err) {
    console.error("Erro ao gerar pergunta do bibliotecário:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const force = new URL(request.url).searchParams.get("force") === "1";

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("id, business_name, description, voice_tone, suggested_prompt, suggested_prompt_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!kit) return NextResponse.json({ prompt: null });

  // Cache hit — pergunta ainda fresca e não forçada.
  const fresh = kit.suggested_prompt && kit.suggested_prompt_at &&
    Date.now() - new Date(kit.suggested_prompt_at).getTime() < STALE_MS;
  if (fresh && !force) return NextResponse.json({ prompt: kit.suggested_prompt });

  const { data: updates } = await supabase
    .from("updates")
    .select("category, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (updates ?? []) as Upd[];
  const prompt = rows.length === 0 ? curated() : (await generateQuestion(kit as Kit, rows)) ?? curated();

  // Persiste (admin — a escrita é interna, não do client).
  const admin = createAdminClient();
  await admin.from("brand_kits")
    .update({ suggested_prompt: prompt, suggested_prompt_at: new Date().toISOString() })
    .eq("id", kit.id);

  return NextResponse.json({ prompt });
}
