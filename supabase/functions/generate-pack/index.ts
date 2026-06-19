import OpenAI, { toFile } from "npm:openai";
import { createClient } from "npm:@supabase/supabase-js";
import { decodeBase64 } from "jsr:@std/encoding/base64";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Janela em que um update temporal ainda conta como "novidade".
const FRESHNESS_DAYS = 7;

// Datas comemorativas universais. Móveis (Carnaval, Páscoa, Mães, Pais, Black Friday)
// guardadas com a data real do ano — RE-CURAR 1×/ano (atualizar para o ano vigente).
const COMMEMORATIVE_DATES: { date: string; name: string; leadDays: number }[] = [
  { date: "2026-01-01", name: "Ano Novo", leadDays: 3 },
  { date: "2026-02-17", name: "Carnaval", leadDays: 5 },
  { date: "2026-03-15", name: "Dia do Consumidor", leadDays: 3 },
  { date: "2026-04-05", name: "Páscoa", leadDays: 7 },
  { date: "2026-05-10", name: "Dia das Mães", leadDays: 7 },
  { date: "2026-06-12", name: "Dia dos Namorados", leadDays: 7 },
  { date: "2026-06-24", name: "São João / Festas Juninas", leadDays: 7 },
  { date: "2026-08-09", name: "Dia dos Pais", leadDays: 7 },
  { date: "2026-09-15", name: "Dia do Cliente", leadDays: 3 },
  { date: "2026-10-12", name: "Dia das Crianças", leadDays: 5 },
  { date: "2026-11-27", name: "Black Friday", leadDays: 7 },
  { date: "2026-12-25", name: "Natal", leadDays: 7 },
];

// Retorna uma dica de data comemorativa próxima (dentro da antecedência), ou "".
function upcomingCommemorativeHint(): string {
  const sp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const today = new Date(sp.getFullYear(), sp.getMonth(), sp.getDate());
  for (const d of COMMEMORATIVE_DATES) {
    const [y, m, dd] = d.date.split("-").map(Number);
    const target = new Date(y, m - 1, dd);
    const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (days >= 0 && days <= d.leadDays) {
      return days === 0
        ? `Hoje é ${d.name}. Se combinar com a marca, use como tema do post — a não ser que haja um acontecimento mais relevante nos updates.`
        : `Faltam ${days} dia(s) para ${d.name}. Considere usar como tema, a não ser que haja um acontecimento mais relevante nos updates.`;
    }
  }
  return "";
}

type Mode = "evento" | "evergreen";

type UpdateRow = {
  id: string;
  category: string;
  content: string;
  created_at: string;
  photo_urls: string[] | null;
};

// ─── Planner ────────────────────────────────────────────────────────────────

async function planTheme(
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

  const modeInstruction = mode === "evento"
    ? `Os updates abaixo são acontecimentos recentes e reais da marca. Escolha o mais interessante para virar um post de novidade.`
    : `NÃO há nenhum acontecimento novo disponível. Os updates abaixo são fatos perenes da marca, sem data. Escolha um e proponha um TEMA DE CONTEÚDO a partir dele — uma dica prática, uma reflexão, um bastidor ou uma pergunta para a audiência. O tema NÃO pode ser um anúncio e NÃO pode fingir que algo acabou de acontecer.`;

  const typeInstruction = aiDecideType
    ? `
Você também deve decidir o FORMATO ideal para este conteúdo seguindo esta hierarquia obrigatória:
- "story" é o padrão — use sempre que o conteúdo for simples, cotidiano ou evergreen
- "post" apenas quando houver uma conquista ou novidade relevante que justifique destaque
${carrosselAvailable
        ? `- "carrossel" quando o tema pedir explicação em série — arquétipos educativos como explicador ("o que é X"), passo a passo, mito × verdade ou dúvidas frequentes. Também para evento importante ou lançamento. Use com parcimônia.`
        : `- "carrossel" NÃO está disponível agora — escolha apenas entre "story" e "post".`}

Adicione "type": ${carrosselAvailable ? `"story" | "post" | "carrossel"` : `"story" | "post"`} no JSON de resposta.`
    : "";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: mode === "evergreen" ? 0.9 : 0.7,
    messages: [{
      role: "user",
      content: `Você é um estrategista de conteúdo para Instagram.
Marca: ${brandKit.business_name ?? ""}
Descrição: ${brandKit.description ?? ""}
Tom: ${brandKit.voice_tone ?? "neutro"}

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

// ─── Embedding ──────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return res.data[0].embedding;
}

// ─── Generator ──────────────────────────────────────────────────────────────

async function generatePack(
  type: string,
  brandKit: Record<string, unknown>,
  updates: { id: string; created_at: string; category: string; content: string }[],
  mode: Mode,
  themeOverride?: string,
) {
  const updatesText = updates.length > 0
    ? updates.map((u) => {
      const date = new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `${date} — ${u.category}: ${u.content}`;
    }).join("\n")
    : "Nenhum update registrado. Baseie-se apenas na descrição da marca.";

  const themeBlock = themeOverride
    ? `\n[TEMA SOLICITADO PELO USUÁRIO]\n${themeOverride}\n`
    : "";

  let taskBlock: string;
  if (themeOverride) {
    taskBlock = `Gere um ${type} para Instagram sobre o TEMA SOLICITADO acima.

Regras obrigatórias:
- O conteúdo deve girar em torno do TEMA SOLICITADO pelo usuário
- Use os RECENT UPDATES como contexto adicional, apenas se forem relacionados ao tema
- Mantenha a DESCRIPTION, tom de voz e identidade da marca`;
  } else if (mode === "evento") {
    taskBlock = `Gere um ${type} para Instagram sobre o acontecimento real dos RECENT UPDATES.

Regras obrigatórias:
- O post é sobre uma novidade verdadeira: uma conquista, lançamento, evento ou parceria recente
- O tom é de rotina: uma empresa compartilhando o que aconteceu
- NÃO crie posts genéricos de apresentação da marca ou propaganda
- Use a DESCRIPTION e BRAND MEMORY apenas para ajustar o tom e a voz, não como assunto`;
  } else {
    taskBlock = `Gere um ${type} de CONTEÚDO para Instagram com base nos RECENT UPDATES como contexto da marca.

Regras obrigatórias:
- PROIBIDO tratar isto como novidade ou anúncio
- PROIBIDO usar expressões como "novidade", "agora tenho", "estou animada para compartilhar", "acabei de", "lançamento", "novo"
- Isto é conteúdo de valor: uma dica prática, uma reflexão, um bastidor ou uma pergunta para a audiência
- Os RECENT UPDATES são fatos perenes da marca, NÃO acontecimentos novos a serem anunciados
- Use a DESCRIPTION e BRAND MEMORY para ajustar o tom e a voz`;
  }

  const prompt = `Você é um especialista em marketing de conteúdo para Instagram.

[DESCRIPTION]
${brandKit.description ?? "Empresa sem descrição cadastrada."}
Tom de voz: ${brandKit.voice_tone ?? "neutro"}

[BRAND MEMORY]
${brandKit.context ?? "Sem histórico acumulado ainda."}

[RECENT UPDATES]
${updatesText}
${themeBlock}
[DO NOT DO]
${brandKit.do_not_do ?? "Nenhuma restrição cadastrada."}

[TAREFA]
${taskBlock}

[ARQUÉTIPO DE CONTEÚDO]
Quando for conteúdo de valor (educativo/dica, não um anúncio de novidade), escolha o ARQUÉTIPO que melhor encaixa no tema e na área da marca, e estruture o conteúdo de acordo com ele:
- Explicador ("o que é X"): define um conceito ou termo da área de forma clara.
- Mito × Verdade: derruba uma crença comum do público.
- Dúvidas frequentes: responde perguntas reais que o público tem.
- Passo a passo / Lista: prático e acionável ("3 erros…", "como fazer X").
- Bastidor / rotina: mostra os bastidores do dia a dia, humaniza a marca.
- Reflexão / posicionamento: opinião ou visão da marca sobre um tema da área.
Para CARROSSEL, prefira os arquétipos educativos (explicador, mito × verdade, passo a passo, dúvidas) — funcionam melhor em série de slides. Escolha UM arquétipo, não misture.

Responda APENAS em JSON, sem markdown.

{
  "title": "título do pack",
  "caption": "legenda para o post",
  "cta": "call to action",
  "slides": [
    { "order": 1, "content": "texto do slide 1" }
  ]
}

Para post e story, retorne apenas 1 slide (sem campo role).
Para carrossel, retorne entre 4 e 5 slides seguindo esta estrutura obrigatória:
- Slide 1: role "hook" — frase de impacto que para o scroll, apresenta o tema
- Slides intermediários: role "body" — cada um desenvolve um ponto específico, conteúdo informativo e conciso
- Último slide: role "cta" — chamada para ação clara, encoraja comentário, salvamento ou contato

Exemplo para carrossel:
{ "order": 1, "role": "hook", "content": "texto do hook" }
{ "order": 2, "role": "body", "content": "ponto 1" }
{ "order": 5, "role": "cta", "content": "texto do cta" }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0].message.content?.trim() ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Image ──────────────────────────────────────────────────────────────────

// Converte uma imagem (data URL base64 OU url http) num File pro images.edit.
async function imageToFile(data: string, name: string, type: string) {
  let buffer: ArrayBuffer;
  if (data.startsWith("data:")) {
    buffer = decodeBase64(data.split(",")[1]).buffer;
  } else {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  }
  return toFile(buffer, name, { type });
}

async function generateCoverImage(
  pack: { title: string; caption: string; type: string; role?: string },
  brandKit: Record<string, unknown>,
  usePersona: boolean,
  updatePhotoUrls?: string[] | null,
  styleRefData?: string | null, // imagem do slide 1 (hook) — âncora visual do carrossel
) {
  const paletteHint = (brandKit.palette_hex as string[] | null)?.length
    ? `Use esta paleta de cores: ${(brandKit.palette_hex as string[]).slice(0, 3).join(", ")}.`
    : "";

  const sizeMap: Record<string, string> = {
    post: "2048x2560",
    carrossel: "2048x2560",
    story: "1152x2048",
  };
  const size = sizeMap[pack.type] ?? "2048x2560";

  const personaUrls = usePersona ? ((brandKit.persona_urls as string[] | null)?.filter(Boolean) ?? []) : [];
  const updatePhotos = updatePhotoUrls?.filter(Boolean) ?? [];

  const personSection = usePersona
    ? `IMPORTANT: The person in the reference image is the real brand owner.
Reproduce their exact facial features, skin tone, hair, and likeness as accurately as possible.
Do NOT create a generic, stock-photo, or AI-looking person. Use the real person's face.`
    : `IMPORTANT: Do NOT include any person or human figure in this image. Focus on design, typography, brand elements, or the update subject.`;

  const isCarousel = pack.type === "carrossel";
  // Composição por role (Nível 1): título só na capa; rodapé de contato só no CTA.
  const roleInstruction = !isCarousel ? "" :
    pack.role === "hook"
      ? `Papel do slide: CAPA (slide 1). Título grande e impactante, identidade de marca forte. Para o scroll. Esta é a capa do carrossel.`
      : pack.role === "cta"
        ? `Papel do slide: CTA (último slide). Foco em ação/engajamento (comentar, salvar, contatar). Inclua AQUI o rodapé de contato da marca (endereço, telefone, e-mail).`
        : `Papel do slide: CORPO (conteúdo). Layout limpo e legível, foco SÓ na mensagem deste slide. NÃO repita o título principal do carrossel. NÃO inclua rodapé de contato neste slide.`;

  // Âncora visual (Nível 2): replica o estilo do slide 1.
  const styleSection = styleRefData
    ? `TEMPLATE VISUAL: a PRIMEIRA imagem de referência é o slide 1 DESTE MESMO carrossel. Replique o sistema visual dela — mesma paleta, mesmo estilo de fundo, mesma posição e tamanho do logo, mesmas fontes e elementos decorativos. Mantenha o carrossel visualmente consistente; mude APENAS o texto/conteúdo para a mensagem deste slide.`
    : "";

  const imagePrompt = `Create an organic Instagram ${isCarousel ? "carousel slide" : pack.type} for the brand "${brandKit.business_name ?? "empresa"}".
Brand context: ${brandKit.description ?? ""}
${paletteHint}
Post theme: ${pack.title}
Slide message: ${pack.caption}
${roleInstruction}
${styleSection}

Reference images provided (in order):
${styleRefData ? "- First image: slide 1 of THIS carousel — the VISUAL TEMPLATE to replicate." : ""}
${personaUrls.length ? "- photos of the brand's real people — use their likeness naturally if relevant" : ""}
${updatePhotos.length ? "- real photos from this specific brand update — use as the main visual subject" : ""}
- Last image: the brand logo — include subtly as brand identity

${personSection}

Visual style rules:
- NO "before/after" charts or infographics
- Looks like an authentic organic brand post, NOT an advertisement
- One clear focal point: the update photo or person if provided`;

  const allReferenceUrls = [
    ...personaUrls.slice(0, 2).map((url: string, i: number) => ({ url, name: `persona-${i}.jpg`, type: "image/jpeg" })),
    ...updatePhotos.slice(0, 2).map((url: string, i: number) => ({ url, name: `update-${i}.jpg`, type: "image/jpeg" })),
  ];

  try {
    const styleRefFile = styleRefData ? await imageToFile(styleRefData, "template.jpg", "image/jpeg") : null;

    if (allReferenceUrls.length > 0 || brandKit.logo_url || styleRefFile) {
      const referenceFiles = await Promise.all(
        allReferenceUrls.map(async ({ url, name, type }) => {
          const res = await fetch(url);
          const buffer = await res.arrayBuffer();
          return toFile(buffer, name, { type });
        })
      );

      let logoFile = null;
      if (brandKit.logo_url) {
        const res = await fetch(brandKit.logo_url as string);
        const buffer = await res.arrayBuffer();
        logoFile = await toFile(buffer, "logo.png", { type: "image/png" });
      }

      // ordem: [template do hook] → [persona/update] → [logo]
      const imageFiles = [
        ...(styleRefFile ? [styleRefFile] : []),
        ...referenceFiles,
        ...(logoFile ? [logoFile] : []),
      ];

      if (imageFiles.length > 0) {
        const response = await openai.images.edit({
          model: "gpt-image-2",
          // deno-lint-ignore no-explicit-any
          image: imageFiles.length === 1 ? imageFiles[0] : imageFiles as any,
          prompt: imagePrompt,
          // deno-lint-ignore no-explicit-any
          size: size as any,
          output_format: "jpeg",
          output_compression: 90,
          n: 1,
        });
        const item = response.data?.[0];
        if (!item) return null;
        if (item.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
        return item.url ?? null;
      }
    }

    // Sem referências — geração direta
    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt: imagePrompt,
      // deno-lint-ignore no-explicit-any
      size: size as any,
      output_format: "jpeg",
      output_compression: 90,
      n: 1,
    });
    const item = response.data?.[0];
    if (!item) return null;
    if (item.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
    return item.url ?? null;
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    return null;
  }
}

// ─── Upload ──────────────────────────────────────────────────────────────────

async function uploadImage(data: string, path: string): Promise<string | null> {
  let buffer: ArrayBuffer;
  if (data.startsWith("data:")) {
    const base64 = data.split(",")[1];
    buffer = decodeBase64(base64).buffer;
  } else {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  }

  const { error } = await supabaseAdmin.storage
    .from("packs")
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });

  if (error) { console.error("Erro upload:", error); return null; }

  const { data: urlData } = supabaseAdmin.storage.from("packs").getPublicUrl(path);
  return urlData.publicUrl;
}

// ─── WhatsApp delivery via Z-API ────────────────────────────────────────────

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

async function sendWhatsAppPack(
  phone: string,
  pack: { title: string; caption: string; cta: string | null; type: string },
  imageUrl: string | null,
) {
  const instanceId = Deno.env.get("Z_API_INSTANCE_ID");
  const token = Deno.env.get("Z_API_TOKEN");
  const clientToken = Deno.env.get("Z_API_CLIENT_TOKEN");
  if (!instanceId || !token) {
    console.warn("Z-API credenciais ausentes — pulando envio WhatsApp");
    return;
  }

  const base = `https://api.z-api.io/instances/${instanceId}/token/${token}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const normalized = normalizePhone(phone);
  const caption = `*${pack.title}*\n\n${pack.caption}${pack.cta ? `\n\n➡️ ${pack.cta}` : ""}\n\n_— Postou_`;

  try {
    if (imageUrl) {
      const res = await fetch(`${base}/send-image`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: normalized, image: imageUrl, caption }),
      });
      if (!res.ok) console.error("Z-API send-image falhou:", await res.text());
    } else {
      const res = await fetch(`${base}/send-text`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: normalized, message: caption }),
      });
      if (!res.ok) console.error("Z-API send-text falhou:", await res.text());
    }
  } catch (err) {
    console.error("Erro envio WhatsApp:", err);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignora — body vazio */ }
  const { brand_kit_id, theme_override, force_type } = body as {
    brand_kit_id?: string;
    theme_override?: string;     // se vier, pula planner e usa esse tema direto
    force_type?: "post" | "carrossel" | "story"; // se vier, gera só esse formato
  };
  // Tipo "efetivo" da geração — pode ser rebaixado em runtime (ex: carrossel
  // esgotado no Starter vira "post"). force_type fica imutável só pra isManual.
  let effectiveType: "post" | "carrossel" | "story" | undefined = force_type;
  if (!brand_kit_id) return new Response(JSON.stringify({ error: "brand_kit_id obrigatório" }), { status: 400 });

  // ─── Auth: server-to-server (internal secret) OU user JWT com ownership ──
  const internalSecret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("authorization") ?? "";
  const expectedInternal = Deno.env.get("INTERNAL_SECRET");

  let isAuthorized = false;

  if (expectedInternal && internalSecret === expectedInternal) {
    // server-to-server confiável (cron-dispatch ou webhook do WhatsApp)
    isAuthorized = true;
  } else if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      // valida se o brand_kit_id pertence ao user
      const { data: ownerCheck } = await supabaseAdmin
        .from("brand_kits")
        .select("user_id")
        .eq("id", brand_kit_id)
        .single();
      if (ownerCheck?.user_id === user.id) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data: brandKit, error: kitError } = await supabaseAdmin
    .from("brand_kits")
    .select("id, user_id, business_name, description, voice_tone, context, do_not_do, post_types, palette_hex, persona_urls, logo_url, whatsapp_number, whatsapp_verified, whatsapp_delivery_enabled")
    .eq("id", brand_kit_id)
    .single();

  if (kitError || !brandKit) return new Response(JSON.stringify({ error: "Brand kit não encontrado" }), { status: 404 });

  // ─── Cotas por plano ─────────────────────────────────────────────────────
  const isManual = !!(force_type || theme_override);

  // ⚠️ Se mudar os limites aqui, atualize também o texto em
  // src/app/(app)/settings/plans/PlansClient.tsx (array `plans`)
  const LIMITS: Record<string, { auto: number; manual: number; carrossel: number }> = {
    free:    { auto: 1, manual: 1, carrossel: 0 },
    starter: { auto: 3, manual: 2, carrossel: 1 },
    pro:     { auto: Infinity, manual: Infinity, carrossel: Infinity },
  };

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("plan, weekly_auto_count, weekly_manual_count, weekly_carrossel_count")
    .eq("id", brandKit.user_id)
    .single();

  const plan = userRow?.plan ?? "free";
  const limits = LIMITS[plan] ?? LIMITS.free;
  const autoCount    = userRow?.weekly_auto_count ?? 0;
  const manualCount  = userRow?.weekly_manual_count ?? 0;
  const carrosselCount = userRow?.weekly_carrossel_count ?? 0;

  // Verifica limite de carrossel
  if (effectiveType === "carrossel" || (!isManual && (brandKit.post_types as string[])?.includes("carrossel"))) {
    if (carrosselCount >= limits.carrossel) {
      if (limits.carrossel === 0) {
        // Free: carrossel bloqueado. O cliente trata o aviso (banner/Ver planos).
        const limitMsg = "Carrossel não está disponível no plano gratuito. Faça upgrade para o Starter.";
        return new Response(JSON.stringify({ error: limitMsg, code: "carrossel_blocked" }), { status: 403 });
      }
      // Starter: carrossel esgotado → rebaixa pra "post" (não bloqueia a geração).
      if (effectiveType === "carrossel") {
        effectiveType = "post";
      }
    }
  }

  // Verifica limite semanal (auto ou manual)
  if (isManual) {
    if (manualCount >= limits.manual) {
      // O cliente trata o aviso de limite (banner). Aqui só retorna o status.
      const limitMsg = `Limite de ${limits.manual} geração${limits.manual > 1 ? "ões" : ""} manual${limits.manual > 1 ? "is" : ""} por semana atingido.`;
      return new Response(JSON.stringify({ error: limitMsg, code: "manual_limit" }), { status: 429 });
    }
  } else {
    if (autoCount >= limits.auto) {
      console.log(`Kit ${brand_kit_id} atingiu limite automático semanal (${autoCount}/${limits.auto})`);
      return new Response(JSON.stringify({ error: "Limite automático semanal atingido", code: "auto_limit" }), { status: 429 });
    }
  }

  const hasPersona = (brandKit.persona_urls as string[] | null)?.length ? true : false;

  // Títulos dos packs recentes (30 dias) — usados pelo planner pra evitar repetição
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentPacks } = await supabaseAdmin
    .from("packs")
    .select("title")
    .eq("brand_kit_id", brand_kit_id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);
  const recentTitles = (recentPacks ?? []).map((p: { title: string }) => p.title).filter(Boolean);

  let updates: UpdateRow[] = [];
  let usePersona = false;
  let mode: Mode = "evergreen";

  if (theme_override) {
    // Modo "gerar sob demanda" — tema vem do user, pula planner.
    // Tema do usuário não é uma novidade automática → trata como evergreen.
    mode = "evergreen";
    usePersona = hasPersona;
    const themeEmbedding = await generateEmbedding(theme_override);

    const { data: matched } = await supabaseAdmin.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brand_kit_id,
      only_unused: false,
      match_count: 5,
    });

    updates = (matched ?? []) as UpdateRow[];
  } else {
    // ─── Dois baldes determinísticos ──────────────────────────────────────
    // Balde de eventos: temporal + dentro da janela de novidade + não usado.
    const freshCutoff = new Date();
    freshCutoff.setDate(freshCutoff.getDate() - FRESHNESS_DAYS);

    const { data: eventBucket } = await supabaseAdmin
      .from("updates")
      .select("id, category, content, created_at, photo_urls")
      .eq("brand_kit_id", brand_kit_id)
      .eq("nature", "temporal")
      .is("used_in_pack_id", null)
      .gte("created_at", freshCutoff.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    const events = (eventBucket ?? []) as UpdateRow[];

    if (events.length > 0) {
      // Tem evento fresco → post de novidade.
      mode = "evento";
      updates = events;
    } else {
      // Sem evento fresco → conteúdo evergreen (não finge ser novidade).
      mode = "evergreen";
      const { data: evergreenBucket } = await supabaseAdmin
        .from("updates")
        .select("id, category, content, created_at, photo_urls")
        .eq("brand_kit_id", brand_kit_id)
        .eq("nature", "evergreen")
        .order("created_at", { ascending: false })
        .limit(15);
      updates = (evergreenBucket ?? []) as UpdateRow[];
    }
  }

  const aiDecideType = !effectiveType && (brandKit.post_types as string[] | null)?.includes("AI") === true;
  let aiChosenType: string | undefined;

  if (updates.length > 0) {
    // dica de data comemorativa só no automático (manual já tem tema do usuário)
    const dateHint = theme_override ? "" : upcomingCommemorativeHint();

    const plan = await planTheme(
      brandKit,
      updates.map((u) => ({ category: u.category, content: u.content })),
      recentTitles,
      hasPersona,
      mode,
      aiDecideType,
      carrosselCount < limits.carrossel, // carrosselAvailable
      dateHint,
    );
    usePersona = plan.use_persona;
    if (aiDecideType) aiChosenType = plan.type;

    // Busca vetorial refina a ordem dentro do balde escolhido.
    const themeEmbedding = await generateEmbedding(plan.theme);
    const { data: matched } = await supabaseAdmin.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brand_kit_id,
      only_unused: mode === "evento",
      match_count: 5,
    });

    // Mantém só os updates do balde escolhido — match_updates não conhece
    // os baldes, então cruzamos pelo id pra não vazar update do balde errado.
    const bucketIds = new Set(updates.map((u) => u.id));
    const refined = ((matched ?? []) as UpdateRow[]).filter((u) => bucketIds.has(u.id));
    if (refined.length > 0) updates = refined;
  }

  // força um tipo específico (effectiveType, já com eventual rebaixamento),
  // senão usa ia_decide ou post_types do brand_kit
  let postTypes: string[] = effectiveType
    ? [effectiveType]
    : aiDecideType
    ? [aiChosenType ?? "story"]
    : (brandKit.post_types ?? ["carrossel", "post"]);

  // Guard final: nunca gerar carrossel acima da cota — cobre IA-decide,
  // post_types literal e o caso da IA ignorar a instrução. Rebaixa → post e dedupa.
  if (carrosselCount >= limits.carrossel) {
    postTypes = [...new Set(postTypes.map((t) => (t === "carrossel" ? "post" : t)))];
  }

  const results: { type: string; pack_id: string }[] = [];

  for (const type of postTypes) {
    // Insere o pack como pending imediatamente — permite retry se falhar
    const { data: pack, error: packError } = await supabaseAdmin
      .from("packs")
      .insert({ brand_kit_id, user_id: brandKit.user_id, type, status: "pending" })
      .select("id")
      .single();

    if (packError || !pack) continue;

    try {
      const generated = await generatePack(type, brandKit, updates, mode, theme_override);
      if (!generated) throw new Error("generatePack retornou null");

      // Atualiza título/caption agora que temos o conteúdo gerado
      await supabaseAdmin
        .from("packs")
        .update({ title: generated.title, caption: generated.caption, cta: generated.cta })
        .eq("id", pack.id);

      const updatePhotoUrls = updates[0]?.photo_urls;
      let slides = (generated.slides ?? []) as { order: number; role?: string; content: string }[];
      // post/story é imagem única — se o LLM devolver vários slides, mantém só o 1º
      if (type !== "carrossel") slides = slides.slice(0, 1);

      // imagens por slide em paralelo:
      //  - post/story: 1 imagem (cover)
      //  - carrossel: 1 imagem por slide (4-5)
      const slideImageUrls: Record<number, string | null> = {};

      if (type === "carrossel" && slides.length > 0) {
        // 1) Gera o HOOK primeiro — ele vira a âncora visual dos demais slides.
        const hookSlide = slides.find((s) => s.role === "hook") ?? slides[0];
        const hookData = await generateCoverImage(
          { title: generated.title, caption: hookSlide.content, type, role: "hook" },
          brandKit,
          usePersona,
          updatePhotoUrls,
        );
        slideImageUrls[hookSlide.order] = hookData
          ? await uploadImage(hookData, `${brandKit.user_id}/${pack.id}/slide-${hookSlide.order}.jpg`)
          : null;

        // 2) Demais slides em paralelo, ancorados no estilo do hook (Nível 2).
        //    Se o hook falhou (hookData null), geram sem âncora (degrada bem).
        const restSlides = slides.filter((s) => s.order !== hookSlide.order);
        await Promise.all(
          restSlides.map(async (s) => {
            const imageData = await generateCoverImage(
              { title: generated.title, caption: s.content, type, role: s.role ?? "body" },
              brandKit,
              usePersona,
              updatePhotoUrls,
              hookData, // âncora visual
            );
            slideImageUrls[s.order] = imageData
              ? await uploadImage(imageData, `${brandKit.user_id}/${pack.id}/slide-${s.order}.jpg`)
              : null;
          }),
        );
      } else {
        // post/story: só uma imagem (cover do slide 1)
        const imageData = await generateCoverImage(
          { title: generated.title, caption: generated.caption, type },
          brandKit,
          usePersona,
          updatePhotoUrls,
        );
        if (imageData) {
          slideImageUrls[1] = await uploadImage(imageData, `${brandKit.user_id}/${pack.id}/slide-1.jpg`);
        }
      }

      const coverImageUrl = slideImageUrls[1] ?? null;

      if (slides.length > 0) {
        await supabaseAdmin.from("slides").insert(
          slides.map((s) => ({
            pack_id: pack.id,
            order: s.order,
            image_url: slideImageUrls[s.order] ?? null,
          })),
        );
      }

      if (updates.length > 0) {
        await supabaseAdmin.from("updates").update({ used_in_pack_id: pack.id }).eq("id", updates[0].id);
      }

      await supabaseAdmin.from("packs").update({ status: "success" }).eq("id", pack.id);

      // Incrementa contador semanal
      const counterField = isManual ? "weekly_manual_count" : "weekly_auto_count";
      await supabaseAdmin.rpc("increment_user_counter", {
        p_user_id: brandKit.user_id,
        p_field: counterField,
      });
      if (type === "carrossel") {
        await supabaseAdmin.rpc("increment_user_counter", {
          p_user_id: brandKit.user_id,
          p_field: "weekly_carrossel_count",
        });
      }

      // Entrega via WhatsApp se habilitado
      if (
        brandKit.whatsapp_delivery_enabled &&
        brandKit.whatsapp_verified &&
        brandKit.whatsapp_number
      ) {
        await sendWhatsAppPack(
          brandKit.whatsapp_number as string,
          { title: generated.title, caption: generated.caption, cta: generated.cta, type },
          coverImageUrl,
        );
      }

      results.push({ type, pack_id: pack.id });
    } catch (err) {
      console.error(`Falha ao gerar pack ${pack.id}:`, err);
      await supabaseAdmin.from("packs").update({ status: "failed" }).eq("id", pack.id);
    }
  }

  return new Response(JSON.stringify({ generated: results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});