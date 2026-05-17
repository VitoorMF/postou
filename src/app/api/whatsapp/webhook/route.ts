import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { classify, generateEmbedding } from "@/lib/ai";
import { sendText, sendButton, normalizePhone } from "@/lib/zapi";

interface PendingAction {
  type: "awaiting_format";
  theme: string;
  expires_at: string;
}

type Format = "post" | "story" | "carrossel";
const VALID_FORMATS: Format[] = ["post", "story", "carrossel"];

// dispara a Edge Function sem aguardar (pra não dar timeout no webhook)
function fireGeneration(brandKitId: string, theme: string, format: Format) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`;
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      brand_kit_id: brandKitId,
      theme_override: theme,
      force_type: format,
    }),
  }).catch((err) => console.error("Erro ao disparar generate-pack:", err));
}

// Z-API envia POST aqui quando chega uma mensagem nova no WhatsApp
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (payload.fromMe) return NextResponse.json({ ok: true });

  const phone = String(payload.phone ?? "");
  if (!phone) return NextResponse.json({ ok: true });

  const normalized = normalizePhone(phone);

  // identifica o user pelo número
  const admin = createAdminClient();
  const { data: kit } = await admin
    .from("brand_kits")
    .select("id, user_id, whatsapp_verified, whatsapp_pending_action")
    .or(`whatsapp_number.eq.+${normalized},whatsapp_number.eq.${normalized}`)
    .maybeSingle();

  if (!kit) return NextResponse.json({ ok: true });

  if (!kit.whatsapp_verified) {
    await sendText(phone, "Você precisa verificar seu número no app primeiro. Acesse Configurar → WhatsApp.");
    return NextResponse.json({ ok: true });
  }

  // ─── 1. Detecta resposta de botão ─────────────────────────────────────────
  const buttonResp = (payload.buttonsResponseMessage ?? payload.listResponseMessage) as
    | { buttonId?: string; selectedRowId?: string }
    | undefined;
  const buttonId = buttonResp?.buttonId ?? buttonResp?.selectedRowId;

  if (buttonId?.startsWith("gen:")) {
    const format = buttonId.slice(4) as Format;
    if (!VALID_FORMATS.includes(format)) {
      await sendText(phone, "Formato inválido.");
      return NextResponse.json({ ok: true });
    }

    const pending = kit.whatsapp_pending_action as PendingAction | null;
    if (!pending || pending.type !== "awaiting_format") {
      await sendText(phone, "Hmm, não tenho nenhum tema pendente. Manda *Gerar agora <tema>* primeiro.");
      return NextResponse.json({ ok: true });
    }
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      await admin.from("brand_kits").update({ whatsapp_pending_action: null }).eq("id", kit.id);
      await sendText(phone, "Esse pedido expirou. Manda de novo com *Gerar agora <tema>*.");
      return NextResponse.json({ ok: true });
    }

    // limpa state e dispara geração (não aguarda — Z-API tem timeout curto)
    await admin.from("brand_kits").update({ whatsapp_pending_action: null }).eq("id", kit.id);
    fireGeneration(kit.id, pending.theme, format);

    await sendText(
      phone,
      `Gerando *${format}* sobre _"${pending.theme}"_ ⏳\n\nVocê recebe aqui em alguns minutos.`,
    );
    return NextResponse.json({ ok: true });
  }

  // ─── 2. Extrai texto da mensagem ──────────────────────────────────────────
  let content: string | null = null;
  let imageUrl: string | null = null;

  const text = payload.text as { message?: string } | undefined;
  const image = payload.image as { imageUrl?: string; caption?: string } | undefined;

  if (text?.message) content = text.message.trim();
  if (image?.imageUrl) {
    imageUrl = image.imageUrl;
    if (image.caption) content = image.caption.trim();
  }

  // ─── 3. Detecta comando "Gerar [agora] <tema>" ────────────────────────────
  if (content) {
    const match = content.match(/^\/?gerar\s+(?:agora\s+)?(.+)/i);
    if (match) {
      const theme = match[1].trim();
      if (theme.length < 3) {
        await sendText(phone, "Me diz o tema também 😅\n\nEx: *Gerar agora Feliz Natal*");
        return NextResponse.json({ ok: true });
      }

      const pending: PendingAction = {
        type: "awaiting_format",
        theme,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      await admin.from("brand_kits").update({ whatsapp_pending_action: pending }).eq("id", kit.id);

      await sendButton(phone, `Tema: _"${theme}"_\n\nQual formato você quer?`, [
        { id: "gen:carrossel", label: "Carrossel" },
        { id: "gen:post", label: "Post" },
        { id: "gen:story", label: "Story" },
      ]);

      return NextResponse.json({ ok: true });
    }
  }

  // ─── 4. Caso contrário, trata como update normal ──────────────────────────
  if (!content && !imageUrl) {
    await sendText(phone, "Hmm, só entendo texto ou imagem com legenda 📝\n\nMe conta uma novidade do seu negócio!");
    return NextResponse.json({ ok: true });
  }

  // baixa imagem se houver
  let photoUrls: string[] | null = null;
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const path = `${kit.user_id}/${Date.now()}-whatsapp.jpg`;
      const { error } = await admin.storage.from("updates").upload(path, buffer, {
        contentType: "image/jpeg",
      });
      if (!error) {
        const { data } = admin.storage.from("updates").getPublicUrl(path);
        photoUrls = [data.publicUrl];
      }
    } catch (err) {
      console.error("Erro ao baixar imagem do WhatsApp:", err);
    }
  }

  const finalContent = content || "Imagem enviada via WhatsApp";

  const [category, embedding] = await Promise.all([
    classify(finalContent),
    generateEmbedding(finalContent),
  ]);

  const { error: insertError } = await admin.from("updates").insert({
    user_id: kit.user_id,
    brand_kit_id: kit.id,
    content: finalContent,
    category,
    photo_urls: photoUrls,
    embedding,
  });

  if (insertError) {
    console.error("Erro ao salvar update do WhatsApp:", insertError);
    await sendText(phone, "Tive um problema pra salvar. Tenta de novo daqui a pouco 🙏");
    return NextResponse.json({ ok: true });
  }

  const replies: Record<string, string> = {
    parceria: "Anotei essa parceria! 🤝",
    conquista: "Conquista anotada! 🏆",
    evento: "Evento registrado! 📅",
    bastidor: "Bastidor anotado! 🎬",
    dica: "Dica salva! 💡",
    novidade: "Novidade anotada! ✨",
    geral: "Anotado! ✓",
  };
  const reply = `${replies[category] ?? "Anotado! ✓"}\n\nVai virar conteúdo no próximo post.`;
  await sendText(phone, reply);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
