import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { classify, generateEmbedding } from "@/lib/ai";
import { sendText, normalizePhone } from "@/lib/zapi";

// Z-API envia POST aqui quando chega uma mensagem nova no WhatsApp
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // ignora mensagens que VOCÊ enviou (Z-API marca como fromMe)
  if (payload.fromMe) return NextResponse.json({ ok: true });

  const phone = String(payload.phone ?? "");
  if (!phone) return NextResponse.json({ ok: true });

  const normalized = normalizePhone(phone);

  // identifica o user pelo número
  const admin = createAdminClient();
  const { data: kit } = await admin
    .from("brand_kits")
    .select("id, user_id, whatsapp_verified")
    .or(`whatsapp_number.eq.+${normalized},whatsapp_number.eq.${normalized}`)
    .maybeSingle();

  if (!kit) {
    // número não cadastrado — ignora silenciosamente (sem expor que existe um sistema)
    return NextResponse.json({ ok: true });
  }

  if (!kit.whatsapp_verified) {
    await sendText(phone, "Você precisa verificar seu número no app primeiro. Acesse Configurar → WhatsApp.");
    return NextResponse.json({ ok: true });
  }

  // extrai conteúdo
  let content: string | null = null;
  let imageUrl: string | null = null;

  const text = payload.text as { message?: string } | undefined;
  const image = payload.image as { imageUrl?: string; caption?: string } | undefined;

  if (text?.message) content = text.message.trim();
  if (image?.imageUrl) {
    imageUrl = image.imageUrl;
    if (image.caption) content = image.caption.trim();
  }

  if (!content && !imageUrl) {
    await sendText(phone, "Hmm, só entendo texto ou imagem com legenda 📝\n\nMe conta uma novidade do seu negócio!");
    return NextResponse.json({ ok: true });
  }

  // baixa imagem se houver e sobe pro Storage
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

  // classifica + embeda
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

  // confirma pro usuário
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

// Z-API às vezes faz GET pra validar a URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
