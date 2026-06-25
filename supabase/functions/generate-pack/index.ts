// MAESTRO do pipeline. Não escreve copy nem desenha imagem — só orquestra:
// auth → cotas → Bibliotecário (contexto) → Diretor (estratégia) →
// Roteirista (copy) → Artista (imagem) → persistência → entrega.
// Cada papel mora no seu módulo; aqui é só a regência.
//
// Fluxo:
//   AUTO/Cron:  Bibliotecário → Diretor (tema + arquétipo por rotação) → Roteirista → Artista
//   MANUAL c/ tema: Bibliotecário → (USER = DIRETOR, pula o planner) → Roteirista → Artista

import { supabaseAdmin, upcomingCommemorativeHint } from "./shared.ts";
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
import { regenerateSlide } from "./regen-slide.ts";
import { fireSlideJob, processSlideJob, type SlideJob } from "./slide-jobs.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignora — body vazio */ }
  const { brand_kit_id, theme_override, force_type, image_urls, use_persona, regen_slide_id, slide_job } = body as {
    brand_kit_id?: string;
    theme_override?: string;     // se vier, pula planner e usa esse tema direto
    force_type?: "post" | "carrossel" | "story"; // se vier, gera só esse formato
    image_urls?: string[];       // fotos anexadas na geração manual → referência visual
    use_persona?: boolean;       // toggle do manual: incluir a persona (só com tema)
    regen_slide_id?: string;     // "refazer esse slide" → regenera 1 imagem só
    slide_job?: SlideJob;        // job interno de 1 imagem — disparado pelo próprio maestro
  };

  // Modo "job de slide" — geração assíncrona de 1 imagem, disparada fire-and-forget
  // pelo próprio maestro (ver slide-jobs.ts). Server-to-server only, nunca do client.
  if (slide_job) {
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedInternal = Deno.env.get("INTERNAL_SECRET");
    if (!expectedInternal || internalSecret !== expectedInternal) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return await processSlideJob(slide_job);
  }

  // Modo "refazer slide" — curto-circuito, não passa pelo fluxo de pack/cota.
  if (regen_slide_id) return await regenerateSlide(regen_slide_id, req);

  // theme_override vira instrução direta pro Roteirista (USER = DIRETOR) — sem
  // limite, um payload gigante infla custo de LLM. Front já limita a 500, isso é o backstop.
  if (theme_override && theme_override.length > 500) {
    return new Response(JSON.stringify({ error: "Tema muito longo (máx. 500 caracteres)" }), { status: 400 });
  }

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

  // Limite semanal (auto/manual): a reserva ATÔMICA de cota acontece dentro do loop,
  // logo antes de gastar com LLM/imagem — ver "try_increment_counter". Checar aqui em
  // cima com um valor lido antes é o TOCTOU que permitia N requests simultâneas (ex: 5
  // cliques rápidos no Generate) passarem todas pelo check antes de qualquer uma
  // incrementar, gerando N packs e pagando N× custo de imagem com cota pra 1 só.

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

  const results: { type: string; pack_id: string; status: string }[] = [];

  const counterField = isManual ? "weekly_manual_count" : "weekly_auto_count";
  const counterLimit = isManual ? limits.manual : limits.auto;

  for (const type of postTypes) {
    // Reserva ATÔMICA da cota (auto/manual) ANTES de gastar qualquer coisa com LLM/imagem.
    // O UPDATE...WHERE no Postgres é atômico — corta a corrida de N requests simultâneas
    // lendo o mesmo contador "zerado" e todas passando juntas.
    const { data: reserved } = await supabaseAdmin.rpc("try_increment_counter", {
      p_user_id: userId,
      p_field: counterField,
      p_limit: counterLimit,
    });

    if (!reserved) {
      // 1ª tentativa do request sem cota → erro pro caller tratar (banner de limite).
      // Tentativas seguintes (fan-out auto com vários types) → só pula esse type.
      if (results.length === 0) {
        const limitMsg = isManual
          ? `Limite de ${limits.manual} geração${limits.manual > 1 ? "ões" : ""} manual${limits.manual > 1 ? "is" : ""} por semana atingido.`
          : "Limite automático semanal atingido";
        return new Response(JSON.stringify({ error: limitMsg, code: isManual ? "manual_limit" : "auto_limit" }), { status: 429 });
      }
      continue;
    }

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

    if (packError || !pack) {
      // cota já reservada mas o pack não foi nem criado — devolve a cota.
      await supabaseAdmin.rpc("decrement_counter", { p_user_id: userId, p_field: counterField });
      continue;
    }

    try {
      // ─── ROTEIRISTA: copy (texto da arte) ──
      const generated = await write(type, { brandKit, updates, mode, themeOverride: theme_override, archetype });
      if (!generated) throw new Error("write retornou null");

      // fotos anexadas na geração manual têm prioridade como referência visual
      const updatePhotoUrls = manualImages.length > 0 ? manualImages : updates[0]?.photo_urls;
      let slides = (generated.slides ?? []) as { order: number; role?: string; content: string }[];
      // post/story é imagem única — se o LLM devolver vários slides, mantém só o 1º
      if (type !== "carrossel") slides = slides.slice(0, 1);

      if (slides.length === 0) {
        // Roteirista não devolveu nada pra desenhar — não tem job pra disparar,
        // então ninguém nunca finalizaria isso. Marca failed agora e devolve a cota.
        await supabaseAdmin.from("packs").update({ status: "failed" }).eq("id", pack.id);
        await supabaseAdmin.rpc("decrement_counter", { p_user_id: userId, p_field: counterField });
        continue;
      }

      // Salva o título já e gera a legenda (rápida, só texto — não espera imagem).
      await supabaseAdmin.from("packs").update({ title: generated.title }).eq("id", pack.id);
      const { caption, cta } = await generateCaption(type, generated.title, slides, brandKit);
      await supabaseAdmin.from("packs").update({ caption, cta }).eq("id", pack.id);

      // Insere os slides como placeholder (image_url null, "pending") — a imagem
      // vira um job assíncrono PRÓPRIO (ver slide-jobs.ts), fora da janela de
      // wall-clock desta requisição. Quem termina por último finaliza o pack.
      const { data: insertedSlides } = await supabaseAdmin
        .from("slides")
        .insert(
          slides.map((s) => ({
            pack_id: pack.id,
            order: s.order,
            content: s.content, // texto da arte — usado pela regeneração de legenda
            image_url: null,
            image_status: "pending",
          })),
        )
        .select("id, order");

      const idByOrder = new Map((insertedSlides ?? []).map((s) => [s.order, s.id as string]));

      const baseJob = {
        packId: pack.id, type: type as SlideJob["type"], title: generated.title,
        brandKit, usePersona, updatePhotoUrls, userId, counterField,
        updateId: updates.length > 0 ? updates[0].id : null,
      };

      if (type === "carrossel") {
        const hookSlide = slides.find((s) => s.role === "hook") ?? slides[0];
        const restSlides = slides
          .filter((s) => s.order !== hookSlide.order)
          .map((s) => ({ slideId: idByOrder.get(s.order)!, order: s.order, role: s.role ?? "body", content: s.content }));

        // Dispara só o HOOK — ele, ao terminar, dispara o resto ancorado no seu resultado.
        fireSlideJob({
          ...baseJob,
          slideId: idByOrder.get(hookSlide.order)!,
          order: hookSlide.order,
          role: "hook",
          slideContent: hookSlide.content,
          isHook: true,
          restSlides,
        });
      } else {
        fireSlideJob({
          ...baseJob,
          slideId: idByOrder.get(1)!,
          order: 1,
          role: "cover",
          slideContent: slides[0]?.content ?? generated.title,
        });
      }

      results.push({ type, pack_id: pack.id, status: "queued" });
    } catch (err) {
      console.error(`Falha ao gerar pack ${pack.id}:`, err);
      await supabaseAdmin.from("packs").update({ status: "failed" }).eq("id", pack.id);
      // devolve a cota — a tentativa não gerou nada de fato.
      await supabaseAdmin.rpc("decrement_counter", { p_user_id: userId, p_field: counterField });
    }
  }

  return new Response(JSON.stringify({ generated: results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
