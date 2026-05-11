import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function planTheme(
  brandKit: Record<string, string | string[] | null>,
  updateSamples: { category: string; content: string }[],
  hasPersona: boolean,
  allUsed = false
): Promise<{ theme: string; use_persona: boolean }> {
  const samplesText = updateSamples
    .map((u) => `- ${u.category}: ${u.content.slice(0, 80)}`)
    .join("\n");

  const personaInstruction = hasPersona
    ? `A marca tem fotos da persona disponíveis. Decida se faz sentido aparecer neste post. Use persona em posts pessoais (bastidor, conquista, evento). Não use em dados técnicos, resultados numéricos ou parcerias entre marcas.`
    : `A marca não tem persona cadastrada. use_persona deve ser false.`;

  const contextInstruction = allUsed
    ? `Todos os updates já foram usados em posts anteriores. Escolha o mais interessante do histórico e reimagine-o com um ângulo diferente — nova perspectiva, novo recorte, novo formato.`
    : `Escolha o update mais relevante e interessante para virar post agora.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: allUsed ? 0.9 : 0.7,
    messages: [{
      role: "user",
      content: `Você é um estrategista de conteúdo para Instagram.

Marca: ${brandKit.business_name ?? ""}
Descrição: ${brandKit.description ?? ""}
Tom: ${brandKit.voice_tone ?? "neutro"}

Updates disponíveis:
${samplesText}

${contextInstruction}
${personaInstruction}

Responda APENAS em JSON:
{"theme": "tema do post em 1 frase curta", "use_persona": true ou false}`,
    }],
  });

  try {
    const raw = res.choices[0].message.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme ?? "novidade da marca",
      use_persona: hasPersona ? (parsed.use_persona ?? false) : false,
    };
  } catch {
    return { theme: "novidade da marca", use_persona: false };
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

interface Slide {
  order: number;
  content: string;
}

interface GeneratedPack {
  title: string;
  caption: string;
  cta: string;
  slides: Slide[];
}

async function generatePack(
  type: string,
  brandKit: Record<string, string | string[] | null>,
  recentPacks: { title: string; caption: string; created_at: string }[],
  recentUpdates: { id: string; created_at: string; category: string; content: string }[]
): Promise<GeneratedPack | null> {
  const updatesText = recentUpdates.length > 0
    ? recentUpdates
      .map((u) => {
        const date = new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        return `${date} — ${u.category}: ${u.content}`;
      })
      .join("\n")
    : "Nenhum update registrado. Baseie-se apenas na descrição da marca.";

  const prompt = `Você é um especialista em marketing de conteúdo para Instagram.

[DESCRIPTION]
${brandKit.description ?? "Empresa sem descrição cadastrada."}
Tom de voz: ${brandKit.voice_tone ?? "neutro"}

[BRAND MEMORY]
${brandKit.context ?? "Sem histórico acumulado ainda."}

[RECENT UPDATES]
${updatesText}

[DO NOT DO]
${brandKit.do_not_do ?? "Nenhuma restrição cadastrada."}

[TAREFA]
Gere um ${type} para Instagram com base nos RECENT UPDATES acima.

Regras obrigatórias:
- Do not repeat the same main update used in recent packs.
- Do not repeat the same headline structure.
- Do not repeat the same visual metaphor.
- Prefer an update not used before.
- O post deve ser sobre um acontecimento real dos RECENT UPDATES 
- NÃO crie posts genéricos de apresentação da marca ou propaganda
- O tom deve ser de rotina: uma empresa compartilhando o que aconteceu, uma conquista, um bastidor, uma novidade real
- Use a DESCRIPTION e BRAND MEMORY apenas para ajustar o tom e a voz, não como assunto principal
- Use o logo fornecido como identidade da marca.
- Se não houver updates, aí sim pode gerar um post sobre a marca

Responda APENAS em JSON, sem nenhum texto fora do JSON, sem markdown, sem explicações.

Formato esperado:
{
  "title": "título do pack",
  "caption": "legenda para o post",
  "cta": "call to action",
  "slides": [
    { "order": 1, "content": "texto do slide 1" },
    { "order": 2, "content": "texto do slide 2" }
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
    return JSON.parse(raw) as GeneratedPack;
  } catch {
    console.error("Falha ao parsear JSON da IA:", raw);
    return null;
  }
}

async function generateCoverImage(
  pack: { title: string; caption: string; type: string },
  brandKit: { description: string | null; palette_hex: string[] | null; business_name: string | null; persona_urls?: string[] | null; logo_url?: string | null },
  updatePhotoUrls?: string[] | null
): Promise<string | null> {
  const paletteHint = brandKit.palette_hex?.length
    ? `Use esta paleta de cores: ${brandKit.palette_hex.slice(0, 3).join(", ")}.`
    : "";

  const updatePhotos = updatePhotoUrls?.filter(Boolean) ?? [];
  const personaUrls = brandKit.persona_urls?.filter(Boolean) ?? [];
  const hasReferences = personaUrls.length > 0 || updatePhotos.length > 0 || !!brandKit.logo_url;

  const sizeMap: Record<string, string> = {
    post: "2048x2560",
    carrossel: "2048x2560",
    story: "1152x2048",
  };
  const size = sizeMap[pack.type] ?? "2048x2560";

  const hasUpdatePhotos = updatePhotos.length > 0;

  const imagePrompt = `Create an organic Instagram post for the brand "${brandKit.business_name ?? "empresa"}".
Brand context: ${brandKit.description ?? ""}
${paletteHint}
Post theme: ${pack.title}
Main message: ${pack.caption}

Reference images provided (in order):
${personaUrls.length ? "- First image(s): photos of the brand's real people — use their likeness naturally if relevant" : ""}
${hasUpdatePhotos ? "- Next image(s): real photos from this specific brand update — use as the main visual subject of the post" : ""}
${hasReferences ? "- Last image: the brand logo — include subtly as brand identity" : ""}

IMPORTANT: The person in the reference image is the real brand owner.
Reproduce their exact facial features, skin tone, hair, and likeness as accurately as possible.
Do NOT create a generic, stock-photo, or AI-looking person. Use the real person's face.

Visual style rules:
- NO "before/after" charts or infographics
- Looks like an authentic organic brand post, NOT an advertisement
- One clear focal point: the update photo or person if provided`;

  try {
    if (hasReferences) {
      // Monta lista de arquivos de referência: personas → fotos do update → logo
      const allReferenceUrls: { url: string; name: string; type: string }[] = [
        ...personaUrls.slice(0, 2).map((url, i) => ({ url, name: `persona-${i}.jpg`, type: "image/jpeg" })),
        ...updatePhotos.slice(0, 2).map((url, i) => ({ url, name: `update-${i}.jpg`, type: "image/jpeg" })),
      ];

      const referenceFiles = await Promise.all(
        allReferenceUrls.map(async ({ url, name, type }) => {
          const res = await fetch(url);
          const buffer = Buffer.from(await res.arrayBuffer());
          return toFile(buffer, name, { type });
        })
      );

      let logoFile = null;
      if (brandKit.logo_url) {
        const res = await fetch(brandKit.logo_url);
        const buffer = Buffer.from(await res.arrayBuffer());
        logoFile = await toFile(buffer, "logo.png", { type: "image/png" });
      }

      const imageFiles = logoFile ? [...referenceFiles, logoFile] : referenceFiles;

      if (imageFiles.length > 0) {
        const response = await openai.images.edit({
          model: "gpt-image-2",
          image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
          prompt: imagePrompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          size: size as any,
          n: 1,
        });

        const item = response.data?.[0];
        if (!item) return null;
        if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
        return item.url ?? null;
      }
    }

    // Sem referências — geração direta com tamanho correto pro story
    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt: imagePrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

async function uploadBase64Image(
  data: string,
  path: string
): Promise<string | null> {
  const admin = createAdminClient();

  let buffer: Buffer;
  if (data.startsWith("data:")) {
    const base64 = data.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } else {
    // é uma URL temporária — faz download
    const res = await fetch(data);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  const { error } = await admin.storage
    .from("packs")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return null;
  }

  const { data: urlData } = admin.storage.from("packs").getPublicUrl(path);
  return urlData.publicUrl;
}

export async function POST(request: Request) {
  const { brand_kit_id } = await request.json();
  if (!brand_kit_id) {
    return NextResponse.json({ error: "brand_kit_id obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();

  // Busca brand kit
  const { data: brandKit, error: kitError } = await supabase
    .from("brand_kits")
    .select("id, user_id, business_name, description, voice_tone, context, do_not_do, post_types, palette_hex, persona_urls, logo_url")
    .eq("id", brand_kit_id)
    .single();

  if (kitError || !brandKit) {
    return NextResponse.json({ error: "Brand kit não encontrado" }, { status: 404 });
  }

  // Busca amostra leve de updates não usados pra planner decidir o tema
  const { data: updateSamples } = await supabase
    .from("updates")
    .select("id, category, content, created_at")
    .eq("brand_kit_id", brand_kit_id)
    .is("used_in_pack_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  let samples = updateSamples ?? [];
  let allUsed = false;
  const hasPersona = (brandKit.persona_urls as string[] | null)?.length ? true : false;

  if (samples.length === 0) {
    const { data: allSamples } = await supabase
      .from("updates")
      .select("id, category, content, created_at")
      .eq("brand_kit_id", brand_kit_id)
      .order("created_at", { ascending: false })
      .limit(20);
    samples = allSamples ?? [];
    allUsed = true;
  }

  // Planner define o tema + busca vetorial puxa os mais relevantes
  let updates: { id: string; content: string; category: string; created_at: string; used_in_pack_id: string | null; photo_urls: string[] | null }[] = [];
  let usePersona = false;

  if (samples.length > 0) {
    const plan = await planTheme(brandKit, samples, hasPersona, allUsed);
    usePersona = plan.use_persona;
    const themeEmbedding = await generateEmbedding(plan.theme);

    // Tenta com unused primeiro
    const { data: matched } = await supabase.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brand_kit_id,
      only_unused: true,
      match_count: 5,
    });

    if (matched && matched.length > 0) {
      updates = matched;
    } else {
      // Fallback: abre pra todos (inclusive já usados)
      const { data: matchedAll } = await supabase.rpc("match_updates", {
        query_embedding: themeEmbedding,
        match_brand_kit_id: brand_kit_id,
        only_unused: false,
        match_count: 5,
      });
      updates = matchedAll ?? [];
    }
  }

  // Busca os packs gerados recentemente (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: packs } = await supabase
    .from("packs")
    .select("title, caption, created_at")
    .eq("brand_kit_id", brand_kit_id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });


  const recentPacks = packs ?? [];
  const recentUpdates = updates ?? [];
  const postTypes: string[] = brandKit.post_types ?? ["carrossel", "post"];
  const results: { type: string; pack_id: string }[] = [];
  const admin = createAdminClient();

  for (const type of postTypes) {
    const generated = await generatePack(type, brandKit, recentPacks, recentUpdates);
    if (!generated) continue;

    // Insere pack
    const { data: pack, error: packError } = await admin
      .from("packs")
      .insert({
        brand_kit_id,
        user_id: brandKit.user_id,
        type,
        title: generated.title,
        caption: generated.caption,
        cta: generated.cta,
      })
      .select("id")
      .single();

    if (packError || !pack) {
      console.error("Erro ao inserir pack:", packError);
      continue;
    }

    // Gera imagem do cover (slide 1)
    const updatePhotoUrls = recentUpdates[0]?.photo_urls as string[] | null;
    const imageData = await generateCoverImage(
      { title: generated.title, caption: generated.caption, type },
      { ...brandKit, persona_urls: brandKit.persona_urls as string[] },
      updatePhotoUrls
    );

    let coverImageUrl: string | null = null;
    if (imageData) {
      coverImageUrl = await uploadBase64Image(
        imageData,
        `${brandKit.user_id}/${pack.id}/slide-1.png`
      );
    }

    // Insere slides — slide 1 com a imagem gerada, demais sem
    if (generated.slides.length > 0) {
      await admin.from("slides").insert(
        generated.slides.map((s) => ({
          pack_id: pack.id,
          order: s.order,
          image_url: s.order === 1 ? coverImageUrl : null,
        }))
      );
    }

    // Marca o update mais recente como usado neste pack
    if (recentUpdates.length > 0) {
      await admin
        .from("updates")
        .update({ used_in_pack_id: pack.id })
        .eq("id", recentUpdates[0].id);
    }

    results.push({ type, pack_id: pack.id });
  }

  return NextResponse.json({ generated: results });
}
