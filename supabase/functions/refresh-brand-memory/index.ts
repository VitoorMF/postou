import OpenAI from "npm:openai";
import { createClient } from "npm:@supabase/supabase-js";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Memória de marca: resumo vivo gravado em brand_kits.context.
// Roda 1×/semana (cron) — desacoplado da geração, que só LÊ o context (custo zero por geração).
const MEMORY_MAX_CHARS = 800;
const ACTIVE_DAYS = 14;   // só marcas ativas recentemente
const STALE_DAYS = 6;     // não re-resume se já foi resumido nos últimos 6 dias
const CONCURRENCY = 4;    // chamadas LLM em paralelo por lote

type Kit = {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  voice_tone: string | null;
  context: string | null;
  context_updated_at: string | null;
};

async function buildMemory(kit: Kit): Promise<string | null> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ data: updates }, { data: packs }] = await Promise.all([
    supabaseAdmin
      .from("updates")
      .select("category, content, nature, created_at")
      .eq("brand_kit_id", kit.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("packs")
      .select("title, type, rating, created_at")
      .eq("brand_kit_id", kit.id)
      .eq("status", "success")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const updatesText = (updates ?? []).length
    ? (updates as { category: string; content: string; nature: string }[])
      .map((u) => `- (${u.nature}/${u.category}) ${u.content.slice(0, 120)}`).join("\n")
    : "(sem novidades recentes)";

  const packsText = (packs ?? []).length
    ? (packs as { title: string; type: string; rating: number | null }[])
      .map((p) => `- [${p.type}] ${p.title}${p.rating === 1 ? " 👍" : p.rating === -1 ? " 👎" : ""}`).join("\n")
    : "(sem posts recentes)";

  const prompt = `Você mantém a MEMÓRIA DE MARCA — um resumo vivo e compacto que ajuda outra IA a gerar conteúdo coerente para esta marca ao longo do tempo.

[MEMÓRIA ATUAL]
${kit.context?.trim() || "(ainda não existe)"}

[MARCA]
Nome: ${kit.business_name ?? "—"}
Descrição: ${kit.description ?? "—"}
Tom de voz: ${kit.voice_tone ?? "neutro"}

[NOVIDADES RECENTES]
${updatesText}

[POSTS GERADOS RECENTES] (👍 = aprovado, 👎 = rejeitado)
${packsText}

Reescreva a MEMÓRIA DE MARCA. Ela é COMPLEMENTAR à identidade: o gerador de conteúdo JÁ recebe nome, descrição, contato e tom de voz separadamente. Portanto:

- NÃO repita a identidade/descrição da marca (nome, endereço, telefone, e-mail, "somos especialistas em…", posicionamento genérico). Isso é redundante e atrapalha.
- Registre APENAS o que se aprende com o tempo:
  • temas/assuntos JÁ abordados nos posts (pra dar continuidade e NÃO repetir);
  • ângulos e formatos que funcionaram (👍) ou não (👎);
  • padrões de tom/estilo observados na prática;
  • fatos perenes NOVOS que surgiram nas novidades (não os do cadastro).
- Baseie-se SOMENTE nos dados reais listados acima (novidades e posts). NÃO invente temas, conquistas nem engajamento. Só cite 👍/👎 se eles realmente aparecerem na lista de posts.
- Descreva o que ACONTECEU (observação factual). NÃO dê conselhos nem estratégia ("é importante…", "o foco deve ser…", "pode-se ampliar…").
- Se NÃO houver posts nem novidades, responda apenas: "Ainda sem histórico de conteúdo." — nada além disso.
- Se houver pouco histórico, escreva CURTO (1-2 frases). NÃO preencha com a descrição da marca.
- MÁXIMO ${MEMORY_MAX_CHARS} caracteres, denso, português, texto corrido, sem markdown, sem títulos.`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });
    const summary = res.choices[0].message.content?.trim();
    if (!summary) return null;
    return summary.slice(0, MEMORY_MAX_CHARS); // cap rígido — entra em todo prompt de geração
  } catch (err) {
    console.error(`Erro ao resumir memória do kit ${kit.id}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  // Mesmo padrão de auth do cron-dispatch
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const activeCutoff = new Date();
  activeCutoff.setDate(activeCutoff.getDate() - ACTIVE_DAYS);
  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);

  // 1) usuários ativos recentemente (não queima LLM em conta morta)
  const { data: activeUsers } = await supabaseAdmin
    .from("users")
    .select("id")
    .gte("last_active_at", activeCutoff.toISOString());

  const activeIds = (activeUsers ?? []).map((u: { id: string }) => u.id);
  if (activeIds.length === 0) {
    return new Response(JSON.stringify({ message: "Nenhuma marca ativa." }), { headers: { "Content-Type": "application/json" } });
  }

  // 2) kits desses usuários que ainda não foram resumidos nos últimos STALE_DAYS
  const { data: kits, error } = await supabaseAdmin
    .from("brand_kits")
    .select("id, user_id, business_name, description, voice_tone, context, context_updated_at")
    .in("user_id", activeIds)
    .or(`context_updated_at.is.null,context_updated_at.lt.${staleCutoff.toISOString()}`);

  if (error) {
    console.error("Erro ao buscar kits:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!kits || kits.length === 0) {
    return new Response(JSON.stringify({ message: "Nenhuma marca para atualizar." }), { headers: { "Content-Type": "application/json" } });
  }

  let updated = 0;
  // processa em lotes pra não estourar rate limit / timeout
  for (let i = 0; i < kits.length; i += CONCURRENCY) {
    const batch = kits.slice(i, i + CONCURRENCY) as Kit[];
    await Promise.all(
      batch.map(async (kit) => {
        const memory = await buildMemory(kit);
        if (!memory) return;
        const { error: upErr } = await supabaseAdmin
          .from("brand_kits")
          .update({ context: memory, context_updated_at: new Date().toISOString() })
          .eq("id", kit.id);
        if (upErr) { console.error(`Erro ao gravar memória do kit ${kit.id}:`, upErr); return; }
        updated++;
      }),
    );
  }

  return new Response(JSON.stringify({ candidates: kits.length, updated }), {
    headers: { "Content-Type": "application/json" },
  });
});
