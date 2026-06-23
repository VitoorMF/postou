// BIBLIOTECÁRIO — só LÊ. Reúne todo o contexto que os outros agentes precisam:
// brand kit, histórico recente (títulos + arquétipos, pra evitar repetição) e os
// updates da marca (baldes evento/evergreen + refino vetorial). Nenhuma decisão
// criativa aqui — isso é do Diretor.

import {
  FRESHNESS_DAYS,
  generateEmbedding,
  type Mode,
  supabaseAdmin,
  type UpdateRow,
} from "./shared.ts";

// Contexto da marca (todas as colunas que o pipeline consome).
export async function fetchBrandKit(brandKitId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseAdmin
    .from("brand_kits")
    .select("id, user_id, business_name, description, voice_tone, context, do_not_do, post_types, palette_hex, persona_urls, logo_url, whatsapp_number, whatsapp_verified, whatsapp_delivery_enabled")
    .eq("id", brandKitId)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

// Títulos dos packs recentes (30 dias) — o Diretor usa pra não repetir tema.
export async function fetchRecentTitles(brandKitId: string): Promise<string[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data } = await supabaseAdmin
    .from("packs")
    .select("title")
    .eq("brand_kit_id", brandKitId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []).map((p: { title: string }) => p.title).filter(Boolean);
}

// Arquétipos dos packs recentes — a rotação usa pra não repetir estrutura.
export async function fetchRecentArchetypes(brandKitId: string, limit = 8): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("packs")
    .select("archetype")
    .eq("brand_kit_id", brandKitId)
    .not("archetype", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? [])
    .map((p: { archetype: string | null }) => p.archetype)
    .filter(Boolean) as string[];
}

// Escolhe a matéria-prima da geração.
//  - com tema do usuário: busca vetorial direta (modo evergreen, sem fingir novidade).
//  - sem tema: dois baldes determinísticos — evento fresco tem prioridade; senão evergreen.
export async function selectUpdates(
  brandKitId: string,
  themeOverride: string | undefined,
): Promise<{ updates: UpdateRow[]; mode: Mode }> {
  if (themeOverride) {
    const themeEmbedding = await generateEmbedding(themeOverride);
    const { data: matched } = await supabaseAdmin.rpc("match_updates", {
      query_embedding: themeEmbedding,
      match_brand_kit_id: brandKitId,
      only_unused: false,
      match_count: 5,
    });
    return { updates: (matched ?? []) as UpdateRow[], mode: "evergreen" };
  }

  // Balde de eventos: temporal + dentro da janela de novidade + não usado.
  const freshCutoff = new Date();
  freshCutoff.setDate(freshCutoff.getDate() - FRESHNESS_DAYS);

  const { data: eventBucket } = await supabaseAdmin
    .from("updates")
    .select("id, category, content, created_at, photo_urls")
    .eq("brand_kit_id", brandKitId)
    .eq("nature", "temporal")
    .is("used_in_pack_id", null)
    .gte("created_at", freshCutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  const events = (eventBucket ?? []) as UpdateRow[];
  if (events.length > 0) {
    // Tem evento fresco → post de novidade.
    return { updates: events, mode: "evento" };
  }

  // Sem evento fresco → conteúdo evergreen (não finge ser novidade).
  const { data: evergreenBucket } = await supabaseAdmin
    .from("updates")
    .select("id, category, content, created_at, photo_urls")
    .eq("brand_kit_id", brandKitId)
    .eq("nature", "evergreen")
    .order("created_at", { ascending: false })
    .limit(15);
  return { updates: (evergreenBucket ?? []) as UpdateRow[], mode: "evergreen" };
}

// Refina a ordem dos updates pelo tema escolhido (busca vetorial), mantendo só
// os do balde já selecionado — match_updates não conhece os baldes.
export async function refineUpdatesByTheme(
  brandKitId: string,
  themeText: string,
  currentUpdates: UpdateRow[],
  mode: Mode,
): Promise<UpdateRow[]> {
  const themeEmbedding = await generateEmbedding(themeText);
  const { data: matched } = await supabaseAdmin.rpc("match_updates", {
    query_embedding: themeEmbedding,
    match_brand_kit_id: brandKitId,
    only_unused: mode === "evento",
    match_count: 5,
  });
  const bucketIds = new Set(currentUpdates.map((u) => u.id));
  const refined = ((matched ?? []) as UpdateRow[]).filter((u) => bucketIds.has(u.id));
  return refined.length > 0 ? refined : currentUpdates;
}
