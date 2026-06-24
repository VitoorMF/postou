// ARTISTAS — transformam a copy em IMAGEM (gpt-image-2). Um "artista" por formato
// (post / story / carrossel), mas todos compartilham o mesmo encanamento
// (renderImage): montar as referências (persona/update/logo), chamar a API e
// devolver um data URL. Cada artista só muda o tamanho e as instruções de papel
// próprias do seu formato — sem duplicar a parte cara/repetitiva.

import { imageToFile, openai, toFile } from "./shared.ts";

// gpt-image-2 normal leva ~15-45s. O default do SDK é 10min de timeout → por isso
// um hang pendurava a função até a Supabase matá-la (pack preso em "pending"). Este
// teto transforma o hang num erro capturável → o pack degrada e completa.
// Knob: manter confortavelmente abaixo do limite de wall-clock do edge.
const IMAGE_TIMEOUT_MS = 60_000;

type RenderSpec = {
  kind: "post" | "story" | "carrossel";
  title: string;
  slideMessage: string;
  brandKit: Record<string, unknown>;
  usePersona: boolean;
  updatePhotoUrls?: string[] | null;
  role?: string;                 // carrossel: hook | body | cta
  styleRefData?: string | null;  // carrossel: imagem do slide 1 (âncora visual)
};

async function renderImage(spec: RenderSpec): Promise<string | null> {
  const { kind, title, slideMessage, brandKit, usePersona, updatePhotoUrls, role, styleRefData } = spec;

  const paletteHint = (brandKit.palette_hex as string[] | null)?.length
    ? `Use esta paleta de cores: ${(brandKit.palette_hex as string[]).slice(0, 3).join(", ")}.`
    : "";

  // 4:5 (post/carrossel) e 9:16 (story). gpt-image-2 exige W e H divisíveis por 16.
  // 1408x1760: ~30% acima do que o feed do IG mostra (~1080) — crocância no zoom/download —
  // mas ~53% mais barato que 2048x2560, que vira 1080 no feed de qualquer jeito.
  const sizeMap: Record<string, string> = {
    post: "1408x1760",
    carrossel: "1408x1760",
    story: "1152x2048",
  };
  const size = sizeMap[kind] ?? "1408x1760";

  const personaUrls = usePersona ? ((brandKit.persona_urls as string[] | null)?.filter(Boolean) ?? []) : [];
  const updatePhotos = updatePhotoUrls?.filter(Boolean) ?? [];

  const personSection = usePersona
    ? `IMPORTANT: The person in the reference image is the real brand owner.
Reproduce their exact facial features, skin tone, hair, and likeness as accurately as possible.
Do NOT create a generic, stock-photo, or AI-looking person. Use the real person's face.`
    : `IMPORTANT: Do NOT include any person or human figure in this image. Focus on design, typography, brand elements, or the update subject.`;

  const isCarousel = kind === "carrossel";
  // Composição por role (Nível 1): título só na capa; rodapé de contato só no CTA.
  const roleInstruction = !isCarousel ? "" :
    role === "hook"
      ? `Papel do slide: CAPA (slide 1). Título grande e impactante, identidade de marca forte. Para o scroll. Esta é a capa do carrossel.`
      : role === "cta"
        ? `Papel do slide: CTA (último slide). Foco em ação/engajamento (comentar, salvar, compartilhar). Rodapé APENAS com o logo e o nome da marca. NÃO inclua endereço, telefone, e-mail ou site — esses dados NÃO foram fornecidos; é PROIBIDO inventar contato.`
        : `Papel do slide: CORPO (conteúdo). Layout limpo e legível, foco SÓ na mensagem deste slide. NÃO repita o título principal do carrossel. NÃO inclua rodapé de contato neste slide.`;

  // Âncora visual (Nível 2): replica o estilo do slide 1.
  const styleSection = styleRefData
    ? `TEMPLATE VISUAL: a PRIMEIRA imagem de referência é o slide 1 DESTE MESMO carrossel. Replique o sistema visual dela — mesma paleta, mesmo estilo de fundo, mesma posição e tamanho do logo, mesmas fontes e elementos decorativos. Mantenha o carrossel visualmente consistente; mude APENAS o texto/conteúdo para a mensagem deste slide.`
    : "";

  const imagePrompt = `Create an organic Instagram ${isCarousel ? "carousel slide" : kind} for the brand "${brandKit.business_name ?? "empresa"}".
Brand context: ${brandKit.description ?? ""}
${paletteHint}
Post theme: ${title}
Slide message: ${slideMessage}
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
- One clear focal point: the update photo or person if provided
- NEVER invent contact info (address, phone, email, website, @handle) or any text/number that wasn't provided. If a detail wasn't given, omit it entirely.`;

  const allReferenceUrls = [
    ...personaUrls.slice(0, 2).map((url: string, i: number) => ({ url, name: `persona-${i}.jpg`, type: "image/jpeg" })),
    ...updatePhotos.slice(0, 5).map((url: string, i: number) => ({ url, name: `update-${i}.jpg`, type: "image/jpeg" })),
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
          output_format: "png",
          n: 1,
        }, { timeout: IMAGE_TIMEOUT_MS, maxRetries: 0 });
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
      output_format: "png",
      n: 1,
    }, { timeout: IMAGE_TIMEOUT_MS, maxRetries: 0 });
    const item = response.data?.[0];
    if (!item) return null;
    if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
    return item.url ?? null;
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    return null;
  }
}

// ─── Os três artistas ─────────────────────────────────────────────────────────

type ArtistArgs = {
  title: string;
  slideContent: string;
  brandKit: Record<string, unknown>;
  usePersona: boolean;
  updatePhotoUrls?: string[] | null;
};

export function postArtist(a: ArtistArgs): Promise<string | null> {
  return renderImage({ kind: "post", title: a.title, slideMessage: a.slideContent, brandKit: a.brandKit, usePersona: a.usePersona, updatePhotoUrls: a.updatePhotoUrls });
}

export function storyArtist(a: ArtistArgs): Promise<string | null> {
  return renderImage({ kind: "story", title: a.title, slideMessage: a.slideContent, brandKit: a.brandKit, usePersona: a.usePersona, updatePhotoUrls: a.updatePhotoUrls });
}

export function carouselArtist(
  a: ArtistArgs & { role: string; styleRefData?: string | null },
): Promise<string | null> {
  return renderImage({
    kind: "carrossel",
    title: a.title,
    slideMessage: a.slideContent,
    brandKit: a.brandKit,
    usePersona: a.usePersona,
    updatePhotoUrls: a.updatePhotoUrls,
    role: a.role,
    styleRefData: a.styleRefData,
  });
}
