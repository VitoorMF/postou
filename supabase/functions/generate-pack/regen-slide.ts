// Regenera a imagem de UM slide só (reaproveita os Artistas). É o backend do botão
// "refazer esse slide" quando uma imagem falhou (degradação → slide com image_url null).
// Roda fora do fluxo de pack inteiro: 1 imagem, barato, sem mexer em cota.

import { fetchBrandKit } from "./librarian.ts";
import { supabaseAdmin, uploadImage } from "./shared.ts";
import { carouselArtist, postArtist, storyArtist } from "./artists.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export async function regenerateSlide(slideId: string, req: Request): Promise<Response> {
  // ─── Auth: user JWT + ownership (slide → pack → user) ──
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: slide } = await supabaseAdmin
    .from("slides")
    .select("id, order, content, pack_id")
    .eq("id", slideId)
    .single();
  if (!slide) return json({ error: "Slide não encontrado" }, 404);

  const { data: pack } = await supabaseAdmin
    .from("packs")
    .select("id, user_id, type, title, brand_kit_id")
    .eq("id", slide.pack_id)
    .single();
  if (!pack || pack.user_id !== user.id) return json({ error: "Não autorizado" }, 403);

  const brandKit = await fetchBrandKit(pack.brand_kit_id);
  if (!brandKit) return json({ error: "Brand kit não encontrado" }, 404);

  // Carrossel: o papel não é guardado no slide → infere pelo order, e usa a CAPA
  // (slide 1) como âncora visual pra manter o estilo consistente.
  let role = "body";
  let styleRefData: string | null = null;
  if (pack.type === "carrossel") {
    const { data: all } = await supabaseAdmin
      .from("slides")
      .select("order, image_url")
      .eq("pack_id", pack.id)
      .order("order", { ascending: true });
    const rows = (all ?? []) as { order: number; image_url: string | null }[];
    const maxOrder = rows.length ? Math.max(...rows.map((s) => s.order)) : slide.order;
    role = slide.order === 1 ? "hook" : slide.order === maxOrder ? "cta" : "body";
    if (role !== "hook") {
      styleRefData = rows.find((s) => s.order === 1)?.image_url ?? null;
    }
  }

  // Persona não é guardada por pack → regen sai sem persona (default seguro).
  const args = {
    title: pack.title as string,
    slideContent: slide.content as string,
    brandKit,
    usePersona: false,
    updatePhotoUrls: null,
  };

  let imageData: string | null = null;
  if (pack.type === "carrossel") {
    imageData = await carouselArtist({ ...args, role, styleRefData });
  } else if (pack.type === "story") {
    imageData = await storyArtist(args);
  } else {
    imageData = await postArtist(args);
  }
  if (!imageData) return json({ error: "Falha ao gerar imagem" }, 502);

  // Nome novo (timestamp) pra não pegar cache do CDN num re-refazer.
  const url = await uploadImage(imageData, `${pack.user_id}/${pack.id}/slide-${slide.order}-${Date.now()}.png`);
  if (!url) return json({ error: "Falha ao salvar imagem" }, 500);

  await supabaseAdmin.from("slides").update({ image_url: url, image_status: "done" }).eq("id", slide.id);
  return json({ image_url: url });
}
