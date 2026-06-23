// MAESTRO do pipeline. Não escreve copy nem desenha imagem — só orquestra:
// auth → cotas → Bibliotecário (contexto) → Diretor (estratégia) →
// Roteirista (copy) → Artista (imagem) → persistência → entrega.
// Cada papel mora no seu módulo; aqui é só a regência.
//
// Fluxo:
//   AUTO/Cron:  Bibliotecário → Diretor (tema + arquétipo por rotação) → Roteirista → Artista
//   MANUAL c/ tema: Bibliotecário → (USER = DIRETOR, pula o planner) → Roteirista → Artista

import { supabaseAdmin, upcomingCommemorativeHint, uploadImage } from "./shared.ts";
import {
  fetchBrandKit,
  fetchRecentArchetypes,
  fetchRecentTitles,
  refineUpdatesByTheme,
  selectUpdates,
} from "./librarian.ts";
import { planTheme } from "./planner.ts";
import { pickArchetype } from "./archetypes.ts";
import { generateCaption, write } from "./writers.ts";
import { carouselArtist, postArtist, storyArtist } from "./artists.ts";
import { sendWhatsAppPack } from "./whatsapp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignora — body vazio */ }
  const { brand_kit_id, theme_override, force_type, image_urls, use_persona } = body as {
    brand_kit_id?: string;
    theme_override?: string;     // se vier, pula planner e usa esse tema direto
    force_type?: "post" | "carrossel" | "story"; // se vier, gera só esse formato
    image_urls?: string[];       // fotos anexadas na geração manual → referência visual
    use_persona?: boolean;       // toggle do manual: incluir a persona (só com tema)
  };
  const manualImages = Array.isArray(image_urls) ? image_urls.filter((u) => typeof u === "string" && u) : [];
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

  // ─── BIBLIOTECÁRIO: contexto da marca ──────────────────────────────────────
  const brandKit = await fetchBrandKit(brand_kit_id);
  if (!brandKit) return new Response(JSON.stringify({ error: "Brand kit não encontrado" }), { status: 404 });
  const userId = brandKit.user_id as string;

  // ─── Cotas por plano ─────────────────────────────────────────────────────
  const isManual = !!(force_type || theme_override);

  // ⚠️ Se mudar os limites aqui, atualize também o texto em
  // src/app/(app)/settings/plans/PlansClient.tsx (array `plans`)
  const LIMITS: Record<string, { auto: number; manual: number; carrossel: number }> = {
    free:    { auto: 1, manual: 1, carrossel: 0 },
    starter: { auto: 3, manual: 2, carrossel: 1 },
    // Pro: teto alto o suficiente pra "postar todos os dias", mas finito —
    // carrossel é o driver de custo (4-5 imagens), por isso fica capado.
    pro:     { auto: 7, manual: 14, carrossel: 4 },
  };

  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("plan, weekly_auto_count, weekly_manual_count, weekly_carrossel_count")
    .eq("id", userId)
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

  // Histórico recente — pro Diretor não repetir tema nem arquétipo.
  const [recentTitles, recentArchetypesInit] = await Promise.all([
    fetchRecentTitles(brand_kit_id),
    fetchRecentArchetypes(brand_kit_id),
  ]);
  let recentArchetypes = recentArchetypesInit;

  // ─── Matéria-prima (updates) + modo ────────────────────────────────────────
  const { updates: bucketUpdates, mode } = await selectUpdates(brand_kit_id, theme_override);
  let updates = bucketUpdates;

  const aiDecideType = !effectiveType && (brandKit.post_types as string[] | null)?.includes("AI") === true;
  let aiChosenType: string | undefined;
  let usePersona = false;

  if (theme_override) {
    // USER = DIRETOR: o tema do usuário JÁ é a direção. Pula o planner; os updates
    // já vêm rankeados pelo tema (busca vetorial no selectUpdates).
    // Persona no manual é opt-in (toggle do front), e só se a marca tiver fotos.
    usePersona = hasPersona && use_persona === true;
  } else if (updates.length > 0) {
    // ─── DIRETOR: decide tema, persona e (se for o caso) formato ──
    const dateHint = upcomingCommemorativeHint();
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
    updates = await refineUpdatesByTheme(brand_kit_id, plan.theme, updates, mode);
  }

  // força um tipo específico (effectiveType, já com eventual rebaixamento),
  // senão usa ia_decide ou post_types do brand_kit
  let postTypes: string[] = effectiveType
    ? [effectiveType]
    : aiDecideType
    ? [aiChosenType ?? "story"]
    : (brandKit.post_types as string[] ?? ["carrossel", "post"]);

  // Guard final: nunca gerar carrossel acima da cota — cobre IA-decide,
  // post_types literal e o caso da IA ignorar a instrução. Rebaixa → post e dedupa.
  if (carrosselCount >= limits.carrossel) {
    postTypes = [...new Set(postTypes.map((t) => (t === "carrossel" ? "post" : t)))];
  }

  const results: { type: string; pack_id: string }[] = [];

  for (const type of postTypes) {
    // ARQUÉTIPO: rotação por código só quando NÃO há tema do usuário.
    // Com tema manual, a estrutura vem do próprio tema (archetype = null).
    const archetype = theme_override ? null : pickArchetype(type, recentArchetypes);
    if (archetype) recentArchetypes = [archetype.key, ...recentArchetypes]; // varia também entre types do mesmo run

    // Insere o pack como pending imediatamente — permite retry se falhar
    const { data: pack, error: packError } = await supabaseAdmin
      .from("packs")
      .insert({ brand_kit_id, user_id: userId, type, status: "pending", is_auto: !isManual, archetype: archetype?.key ?? null })
      .select("id")
      .single();

    if (packError || !pack) continue;

    try {
      // ─── ROTEIRISTA: copy (texto da arte) ──
      const generated = await write(type, { brandKit, updates, mode, themeOverride: theme_override, archetype });
      if (!generated) throw new Error("write retornou null");

      // fotos anexadas na geração manual têm prioridade como referência visual
      const updatePhotoUrls = manualImages.length > 0 ? manualImages : updates[0]?.photo_urls;
      let slides = (generated.slides ?? []) as { order: number; role?: string; content: string }[];
      // post/story é imagem única — se o LLM devolver vários slides, mantém só o 1º
      if (type !== "carrossel") slides = slides.slice(0, 1);

      // Salva o título já. A LEGENDA roda em PARALELO com as imagens (só precisa do texto dos slides).
      await supabaseAdmin.from("packs").update({ title: generated.title }).eq("id", pack.id);
      const captionPromise = generateCaption(type, generated.title, slides, brandKit);

      // ─── ARTISTA: imagens por slide em paralelo ──
      //  - post/story: 1 imagem (cover)
      //  - carrossel: 1 imagem por slide (4-5)
      const slideImageUrls: Record<number, string | null> = {};

      if (type === "carrossel" && slides.length > 0) {
        // 1) Gera o HOOK primeiro — ele vira a âncora visual dos demais slides.
        const hookSlide = slides.find((s) => s.role === "hook") ?? slides[0];
        const hookData = await carouselArtist({
          title: generated.title, slideContent: hookSlide.content, role: "hook",
          brandKit, usePersona, updatePhotoUrls,
        });
        slideImageUrls[hookSlide.order] = hookData
          ? await uploadImage(hookData, `${userId}/${pack.id}/slide-${hookSlide.order}.png`)
          : null;

        // 2) Demais slides em paralelo, ancorados no estilo do hook (Nível 2).
        //    Se o hook falhou (hookData null), geram sem âncora (degrada bem).
        const restSlides = slides.filter((s) => s.order !== hookSlide.order);
        await Promise.all(
          restSlides.map(async (s) => {
            const imageData = await carouselArtist({
              title: generated.title, slideContent: s.content, role: s.role ?? "body",
              brandKit, usePersona, updatePhotoUrls, styleRefData: hookData, // âncora visual
            });
            slideImageUrls[s.order] = imageData
              ? await uploadImage(imageData, `${userId}/${pack.id}/slide-${s.order}.png`)
              : null;
          }),
        );
      } else {
        // post/story: só uma imagem (cover do slide 1).
        // Renderiza o TEXTO DO SLIDE na arte (não a legenda) — assim a legenda
        // complementa a imagem em vez de repetir o que já está nela.
        const artistArgs = {
          title: generated.title, slideContent: slides[0]?.content ?? generated.title,
          brandKit, usePersona, updatePhotoUrls,
        };
        const imageData = type === "story" ? await storyArtist(artistArgs) : await postArtist(artistArgs);
        if (imageData) {
          slideImageUrls[1] = await uploadImage(imageData, `${userId}/${pack.id}/slide-1.png`);
        }
      }

      // Legenda (rodou em paralelo às imagens) — salva agora.
      const { caption, cta } = await captionPromise;
      await supabaseAdmin.from("packs").update({ caption, cta }).eq("id", pack.id);

      const coverImageUrl = slideImageUrls[1] ?? null;

      if (slides.length > 0) {
        await supabaseAdmin.from("slides").insert(
          slides.map((s) => ({
            pack_id: pack.id,
            order: s.order,
            content: s.content,            // texto da arte — usado pela regeneração de legenda
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
        p_user_id: userId,
        p_field: counterField,
      });
      if (type === "carrossel") {
        await supabaseAdmin.rpc("increment_user_counter", {
          p_user_id: userId,
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
          { title: generated.title, caption, cta, type },
          coverImageUrl,
          pack.id,
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
