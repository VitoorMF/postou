import OpenAI, { toFile } from "npm:openai";
import { createClient } from "npm:@supabase/supabase-js";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── Planner ────────────────────────────────────────────────────────────────

async function planTheme(
  brandKit: Record<string, unknown>,
  samples: { category: string; content: string }[],
  recentTitles: string[],
  hasPersona: boolean,
  allUsed: boolean
): Promise<{ theme: string; use_persona: boolean }> {
  const samplesText = samples.map((u) => `- ${u.category}: ${u.content.slice(0, 80)}`).join("\n");

  const avoidText = recentTitles.length > 0
    ? `\nTemas já usados recentemente (NÃO repita nem temas similares):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const personaInstruction = hasPersona
    ? `A marca tem fotos da persona disponíveis. Decida se faz sentido aparecer neste post. Use persona em posts pessoais (bastidor, conquista, evento). Não use em dados técnicos ou parcerias.`
    : `A marca não tem persona cadastrada. use_persona deve ser false.`;

  const contextInstruction = allUsed
    ? `Todos os updates já foram usados. Seja criativo: escolha um dos formatos abaixo que ainda não foi feito recentemente e adapte aos updates disponíveis ou ao nicho da marca.
Formatos disponíveis:
- Dica prática do setor
- Curiosidade do nicho
- Bastidor / rotina da marca
- Reflexão ou insight pessoal
- Tendência do mercado
- Erro comum e como evitar
- Pergunta para engajar a audiência
- Conquista passada contada de outro ângulo`
    : `Escolha o update mais relevante e interessante para virar post agora.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: allUsed ? 0.95 : 0.7,
    messages: [{
      role: "user",
      content: `Você é um estrategista de conteúdo para Instagram.
Marca: ${brandKit.business_name ?? ""}
Descrição: ${brandKit.description ?? ""}
Tom: ${brandKit.voice_tone ?? "neutro"}

Updates disponíveis:
${samplesText}
${avoidText}

${contextInstruction}
${personaInstruction}

Responda APENAS em JSON: {"theme": "tema em 1 frase curta", "use_persona": true ou false}`,
    }],
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content?.trim() ?? "{}");
    return {
      theme: parsed.theme ?? "bastidor da marca",
      use_persona: hasPersona ? (parsed.use_persona ?? false) : false,
    };
  } catch {
    return { theme: "bastidor da marca", use_persona: false };
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

  const taskBlock = themeOverride
    ? `Gere um ${type} para Instagram sobre o TEMA SOLICITADO acima.

Regras obrigatórias:
- O conteúdo deve girar em torno do TEMA SOLICITADO pelo usuário
- Use os RECENT UPDATES como contexto adicional, apenas se forem relacionados ao tema
- Mantenha a DESCRIPTION, tom de voz e identidade da marca`
    : `Gere um ${type} para Instagram com base nos RECENT UPDATES acima.

Regras obrigatórias:
- O post deve ser sobre um acontecimento real dos RECENT UPDATES
- NÃO crie posts genéricos de apresentação da marca ou propaganda
- O tom deve ser de rotina: uma empresa compartilhando o que aconteceu, uma conquista, um bastidor, uma novidade real
- Use a DESCRIPTION e BRAND MEMORY apenas para ajustar o tom e a voz
- Se não houver updates, aí sim pode gerar um post sobre a marca`;

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

Responda APENAS em JSON, sem markdown.

{
  "title": "título do pack",
  "caption": "legenda para o post",
  "cta": "call to action",
  "slides": [
    { "order": 1, "content": "texto do slide 1" }
  ]
}

Para post e story, retorne apenas 1 slide.
Para carrossel, retorne entre 5 e 9 slides.`;

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

async function generateCoverImage(
  pack: { title: string; caption: string; type: string },
  brandKit: Record<string, unknown>,
  usePersona: boolean,
  updatePhotoUrls?: string[] | null
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

  const imagePrompt = `Create an organic Instagram post for the brand "${brandKit.business_name ?? "empresa"}".
Brand context: ${brandKit.description ?? ""}
${paletteHint}
Post theme: ${pack.title}
Main message: ${pack.caption}

Reference images provided (in order):
${personaUrls.length ? "- First image(s): photos of the brand's real people — use their likeness naturally if relevant" : ""}
${updatePhotos.length ? "- Next image(s): real photos from this specific brand update — use as the main visual subject" : ""}
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
    if (allReferenceUrls.length > 0 || brandKit.logo_url) {
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

      const imageFiles = logoFile ? [...referenceFiles, logoFile] : referenceFiles;

      if (imageFiles.length > 0) {
        const response = await openai.images.edit({
          model: "gpt-image-2",
          // deno-lint-ignore no-explicit-any
          image: imageFiles.length === 1 ? imageFiles[0] : imageFiles as any,
          prompt: imagePrompt,
          // deno-lint-ignore no-explicit-any
          size: size as any,
          n: 1,
        });
        const item = response.data?.[0];
        if (!item) return null;
        if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
        return item.url ?? null;
      }
    }

    // Sem referências — geração direta
    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt: imagePrompt,
      // deno-lint-ignore no-explicit-any
      size: size as any,
      n: 1,
    });
    const item = response.data?.[0];
    if (!item) return null;
    if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
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
    buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
  } else {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  }

  const { error } = await supabaseAdmin.storage
    .from("packs")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

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

  const body = await req.json();
  const { brand_kit_id, theme_override, force_type } = body as {
    brand_kit_id?: string;
    theme_override?: string;     // se vier, pula planner e usa esse tema direto
    force_type?: "post" | "carrossel" | "story"; // se vier, gera só esse formato
  };
  if (!brand_kit_id) return new Response(JSON.stringify({ error: "brand_kit_id obrigatório" }), { status: 400 });

  const { data: brandKit, error: kitError } = await supabaseAdmin
    .from("brand_kits")
    .select("id, user_id, business_name, description, voice_tone, context, do_not_do, post_types, palette_hex, persona_urls, logo_url, whatsapp_number, whatsapp_verified, whatsapp_delivery_enabled")
    .eq("id", brand_kit_id)
    .single();

  if (kitError || !brandKit) return new Response(JSON.stringify({ error: "Brand kit não encontrado" }), { status: 404 });

  // Busca samples pra o planner
  const { data: updateSamples } = await supabaseAdmin
    .from("updates")
    .select("id, category, content, created_at")
    .eq("brand_kit_id", brand_kit_id)
    .is("used_in_pack_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const hasPersona = (brandKit.persona_urls as string[] | null)?.length ? true : false;

  // Se não tem unused, busca todos pra o planner reimaginar
  let samples = updateSamples ?? [];
  let allUsed = false;

  if (samples.length === 0) {
    const { data: allSamples } = await supabaseAdmin
      .from("updates")
      .select("id, category, content, created_at")
      .eq("brand_kit_id", brand_kit_id)
      .order("created_at", { ascending: false })
      .limit(20);
    samples = allSamples ?? [];
    allUsed = true;
  }

  // Busca títulos dos packs recentes pra evitar repetição
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

  let updates: { id: string; content: string; category: string; created_at: string; photo_urls: string[] | null; used_in_pack_id: string | null }[] = [];
  let usePersona = false;

  if (theme_override) {
    // Modo "gerar sob demanda" — tema vem do user, pula planner
    usePersona = hasPersona; // deixa a IA decidir nas imagens se faz sentido
    const themeEmbedding = await generateEmbedding(theme_override);

    const { data: matched } = await supabaseAdmin.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brand_kit_id,
      only_unused: false, // pode reusar updates (é tema do user, não baseado em update novo)
      match_count: 5,
    });

    updates = matched ?? [];
    // se nada relacionado, segue sem updates — gera apenas com brand kit + tema
  } else if (samples.length > 0) {
    const plan = await planTheme(brandKit, samples, recentTitles, hasPersona, allUsed);
    usePersona = plan.use_persona;
    const themeEmbedding = await generateEmbedding(plan.theme);

    const { data: matched } = await supabaseAdmin.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brand_kit_id,
      only_unused: !allUsed,
      match_count: 5,
    });

    updates = matched ?? [];
  }

  // se force_type vier, só esse formato; senão, usa o que o brand_kit configurou
  const postTypes: string[] = force_type
    ? [force_type]
    : (brandKit.post_types ?? ["carrossel", "post"]);
  const results: { type: string; pack_id: string }[] = [];

  for (const type of postTypes) {
    const generated = await generatePack(type, brandKit, updates, theme_override);
    if (!generated) continue;

    const { data: pack, error: packError } = await supabaseAdmin
      .from("packs")
      .insert({ brand_kit_id, user_id: brandKit.user_id, type, title: generated.title, caption: generated.caption, cta: generated.cta })
      .select("id")
      .single();

    if (packError || !pack) continue;

    const updatePhotoUrls = updates[0]?.photo_urls;
    const imageData = await generateCoverImage(
      { title: generated.title, caption: generated.caption, type },
      brandKit,
      usePersona,
      updatePhotoUrls
    );

    let coverImageUrl: string | null = null;
    if (imageData) {
      coverImageUrl = await uploadImage(imageData, `${brandKit.user_id}/${pack.id}/slide-1.png`);
    }

    if (generated.slides?.length > 0) {
      await supabaseAdmin.from("slides").insert(
        generated.slides.map((s: { order: number; content: string }) => ({
          pack_id: pack.id,
          order: s.order,
          image_url: s.order === 1 ? coverImageUrl : null,
        }))
      );
    }

    if (updates.length > 0) {
      await supabaseAdmin.from("updates").update({ used_in_pack_id: pack.id }).eq("id", updates[0].id);
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
  }

  return new Response(JSON.stringify({ generated: results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
