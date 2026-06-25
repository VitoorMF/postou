// Job assíncrono de geração de UMA imagem de slide, disparado fire-and-forget pelo
// index.ts (e encadeado entre si no carrossel: hook → resto). Existe pra tirar a
// geração de imagem da janela síncrona de wall-clock da function (150s no Free) —
// cada job é sua PRÓPRIA invocação, com seu próprio orçamento, em vez de competir
// com hook+resto+roteirista dentro de uma única requisição.
//
// Quem finaliza o pack (status success/failed, devolução de cota, contador de
// carrossel, entrega no WhatsApp) é o ÚLTIMO job a terminar — nunca antes.

import { supabaseAdmin, uploadImage } from "./shared.ts";
import { carouselArtist, postArtist, storyArtist } from "./artists.ts";
import { sendWhatsAppPack } from "./whatsapp.ts";

export interface SlideJob {
  packId: string;
  slideId: string;
  order: number;
  role: string; // hook | body | cta (carrossel) | cover (post/story)
  type: "post" | "story" | "carrossel";
  title: string;
  slideContent: string;
  brandKit: Record<string, unknown>;
  usePersona: boolean;
  updatePhotoUrls?: string[] | null;
  styleRefUrl?: string | null; // âncora visual (carrossel, slides não-hook)
  isHook?: boolean; // true → ao terminar, dispara o resto do carrossel
  restSlides?: { slideId: string; order: number; role: string; content: string }[];
  userId: string;
  counterField: "weekly_auto_count" | "weekly_manual_count";
  updateId?: string | null; // updates[0].id — marca used_in_pack_id no sucesso
}

function selfUrl() {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-pack`;
}

// Fire-and-forget — não espera resposta. A invocação chamada roda como request
// própria, com wall-clock independente da que disparou.
export function fireSlideJob(job: SlideJob) {
  fetch(selfUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("INTERNAL_SECRET") ?? "" },
    body: JSON.stringify({ slide_job: job }),
  }).catch((err) => console.error("Erro ao disparar slide job:", err));
}

const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });

export async function processSlideJob(job: SlideJob): Promise<Response> {
  const args = {
    title: job.title,
    slideContent: job.slideContent,
    brandKit: job.brandKit,
    usePersona: job.usePersona,
    updatePhotoUrls: job.updatePhotoUrls,
  };

  let imageData: string | null = null;
  if (job.type === "carrossel") {
    imageData = await carouselArtist({ ...args, role: job.role, styleRefData: job.styleRefUrl });
  } else if (job.type === "story") {
    imageData = await storyArtist(args);
  } else {
    imageData = await postArtist(args);
  }

  const url = imageData ? await uploadImage(imageData, `${job.userId}/${job.packId}/slide-${job.order}.png`) : null;

  await supabaseAdmin
    .from("slides")
    .update({ image_url: url, image_status: url ? "done" : "failed" })
    .eq("id", job.slideId);

  // Hook: dispara o resto agora, ancorado no resultado (mesmo se falhou — degrada sem âncora).
  if (job.isHook && job.restSlides?.length) {
    for (const s of job.restSlides) {
      fireSlideJob({
        ...job,
        slideId: s.slideId,
        order: s.order,
        role: s.role,
        slideContent: s.content,
        styleRefUrl: url,
        isHook: false,
        restSlides: undefined,
      });
    }
    return ok();
  }

  // Ainda tem slide pendente nesse pack? Quem for o ÚLTIMO a terminar finaliza.
  const { data: pending } = await supabaseAdmin
    .from("slides")
    .select("id")
    .eq("pack_id", job.packId)
    .eq("image_status", "pending");

  if (pending && pending.length > 0) return ok();

  await finalizePack(job);
  return ok();
}

async function finalizePack(job: SlideJob) {
  const { data: slides } = await supabaseAdmin
    .from("slides")
    .select("order, image_url")
    .eq("pack_id", job.packId)
    .order("order", { ascending: true });

  const anyImage = (slides ?? []).some((s) => !!s.image_url);
  const newStatus = anyImage ? "success" : "failed";

  // Reivindica atomicamente — só quem ganhar a corrida (status ainda "pending") finaliza
  // de verdade. Evita devolver cota 2x ou mandar WhatsApp 2x numa corrida rara.
  const { data: claimed } = await supabaseAdmin
    .from("packs")
    .update({ status: newStatus })
    .eq("id", job.packId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) return;

  if (!anyImage) {
    // Wipeout total — não foi geração de verdade, devolve a cota reservada.
    await supabaseAdmin.rpc("decrement_counter", { p_user_id: job.userId, p_field: job.counterField });
    return;
  }

  if (job.updateId) {
    await supabaseAdmin.from("updates").update({ used_in_pack_id: job.packId }).eq("id", job.updateId);
  }
  if (job.type === "carrossel") {
    await supabaseAdmin.rpc("increment_user_counter", { p_user_id: job.userId, p_field: "weekly_carrossel_count" });
  }

  // Entrega no WhatsApp só agora — pack de fato pronto (não antes, parcial).
  const { data: pack } = await supabaseAdmin
    .from("packs")
    .select("caption, cta, title, brand_kit_id")
    .eq("id", job.packId)
    .single();
  if (!pack) return;

  const { data: brandKit } = await supabaseAdmin
    .from("brand_kits")
    .select("whatsapp_delivery_enabled, whatsapp_verified, whatsapp_number")
    .eq("id", pack.brand_kit_id)
    .single();

  if (brandKit?.whatsapp_delivery_enabled && brandKit.whatsapp_verified && brandKit.whatsapp_number) {
    const coverImageUrl = (slides ?? []).find((s) => s.order === 1)?.image_url ?? null;
    await sendWhatsAppPack(
      brandKit.whatsapp_number as string,
      { title: pack.title as string, caption: pack.caption as string, cta: pack.cta as string | null, type: job.type },
      coverImageUrl,
      job.packId,
    );
  }
}
