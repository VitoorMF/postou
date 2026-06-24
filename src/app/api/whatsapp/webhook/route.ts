import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { whatsappAgent, classify, generateEmbedding } from "@/lib/ai";
import { sendText, sendButton, normalizePhone } from "@/lib/zapi";

interface PendingAction {
  type: "awaiting_format";
  theme: string;
  expires_at: string;
}

type Format = "post" | "story" | "carrossel";
const VALID_FORMATS: Format[] = ["post", "story", "carrossel"];

// memória curta da conversa (janela de 10 min, só texto)
type WaCtx = { role: "user" | "assistant"; at: number; text: string };

// dispara a Edge Function sem aguardar (pra não dar timeout no webhook)
function fireGeneration(brandKitId: string, theme: string, format: Format) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`;
  const internalSecret = process.env.INTERNAL_SECRET;
  if (!internalSecret) {
    console.error("INTERNAL_SECRET ausente");
    return;
  }
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": internalSecret,
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
  // ─── Segurança: valida o Client-Token que a Z-API envia no header ───
  // Sem isso, qualquer um que soubesse o número verificado de um cliente
  // podia forjar mensagens (gravar updates falsos, disparar geração, etc).
  //
  // TEMP DEBUG — só loga, não bloqueia ainda. Confirmar no log se a Z-API
  // de fato manda o header "client-token" no webhook antes de ativar o bloqueio.
  const expectedToken = process.env.Z_API_CLIENT_TOKEN;
  const receivedToken = request.headers.get("client-token");
  console.log("[whatsapp-webhook][TEMP DEBUG] headers:", Object.fromEntries(request.headers));
  console.log("[whatsapp-webhook][TEMP DEBUG] client-token recebido:", receivedToken, "| bateu com o esperado?", receivedToken === expectedToken);
  // if (!expectedToken || receivedToken !== expectedToken) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

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
    .select("id, user_id, whatsapp_verified, whatsapp_pending_action, whatsapp_context")
    .or(`whatsapp_number.eq.+${normalized},whatsapp_number.eq.${normalized}`)
    .maybeSingle();

  if (!kit) return NextResponse.json({ ok: true });

  if (!kit.whatsapp_verified) {
    await sendText(phone, "Você precisa verificar seu número no app primeiro. Acesse Configurar → WhatsApp.");
    return NextResponse.json({ ok: true });
  }

  // ─── 1. Resposta de botão (escolha de formato) ─────────────────────────────
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

    await admin.from("brand_kits").update({ whatsapp_pending_action: null }).eq("id", kit.id);
    fireGeneration(kit.id, pending.theme, format);
    await sendText(phone, `Gerando *${format}* sobre _"${pending.theme}"_ ⏳\n\nVocê recebe aqui em alguns minutos.`);
    return NextResponse.json({ ok: true });
  }

  // ─── 2. Extrai texto/imagem ────────────────────────────────────────────────
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

  // ─── 3. Texto puro → o agente decide a intenção e já escreve a resposta ─────
  if (content && !imageUrl) {
    const userText = content;

    // memória da conversa: mantém as últimas N msgs ENQUANTO for a mesma sessão.
    // "mesma sessão" = gap curto desde a última msg (não idade absoluta) — assim uma
    // conversa ativa que passa de 10 min não perde a cabeça, e um buraco longo zera.
    const SAME_SESSION_MS = 30 * 60 * 1000; // gap máx. entre msgs da mesma conversa
    const WINDOW = 10; // nº de mensagens mantidas
    const stored = (kit.whatsapp_context as WaCtx[] | null) ?? [];
    const last = stored[stored.length - 1];
    const sameSession = last ? Date.now() - last.at < SAME_SESSION_MS : false;
    const recent = sameSession ? stored.slice(-WINDOW) : [];
    const contextStr = recent.map((h) => `${h.role === "user" ? "Dono" : "Você"}: ${h.text}`).join("\n");

    // grava o turno (mensagem + resposta) na sessão, capada em N
    const logTurn = async (assistantText: string) => {
      const now = Date.now();
      const next = [
        ...recent,
        { role: "user" as const, at: now, text: userText.slice(0, 280) },
        { role: "assistant" as const, at: now, text: assistantText.slice(0, 280) },
      ].slice(-WINDOW);
      await admin.from("brand_kits").update({ whatsapp_context: next }).eq("id", kit.id);
    };

    const a = await whatsappAgent(userText, contextStr || undefined);

    // pedido de geração com tema → pede o formato (botões)
    if (a.intent === "generate" && a.theme && a.theme.length >= 3) {
      const pending: PendingAction = {
        type: "awaiting_format",
        theme: a.theme,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      await admin.from("brand_kits").update({ whatsapp_pending_action: pending }).eq("id", kit.id);
      await sendButton(phone, `Tema: _"${a.theme}"_\n\nQual formato você quer?`, [
        { id: "gen:carrossel", label: "Carrossel" },
        { id: "gen:post", label: "Post" },
        { id: "gen:story", label: "Story" },
      ]);
      await logTurn(`Perguntei qual formato pro post sobre "${a.theme}".`);
      return NextResponse.json({ ok: true });
    }

    // avaliação → grava no último post entregue
    if (a.intent === "rating") {
      const { data: lastPack } = await admin
        .from("packs")
        .select("id")
        .eq("brand_kit_id", kit.id)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastPack) {
        await admin.from("packs").update({ rating: a.sentiment === "negative" ? -1 : 1 }).eq("id", lastPack.id);
      }
      await sendText(phone, a.reply);
      await logTurn(a.reply);
      return NextResponse.json({ ok: true });
    }

    // question / smalltalk / clarify / generate-sem-tema → só responde (a IA já escreveu)
    if (a.intent !== "update") {
      await sendText(phone, a.reply);
      await logTurn(a.reply);
      return NextResponse.json({ ok: true });
    }

    // update → anota (categoria já veio do agente)
    const embedding = await generateEmbedding(userText);
    const { error } = await admin.from("updates").insert({
      user_id: kit.user_id,
      brand_kit_id: kit.id,
      content: userText,
      category: a.category ?? "geral",
      embedding,
    });
    if (error) {
      console.error("Erro ao salvar update do WhatsApp:", error);
      await sendText(phone, "Tive um problema pra salvar. Tenta de novo daqui a pouco 🙏");
      return NextResponse.json({ ok: true });
    }
    await sendText(phone, a.reply);
    await logTurn(a.reply);
    return NextResponse.json({ ok: true });
  }

  // ─── 4. Imagem → sempre conteúdo (update) ──────────────────────────────────
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
  const [category, embedding] = await Promise.all([classify(finalContent), generateEmbedding(finalContent)]);

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

  await sendText(phone, "Anotei essa! 📸 Vai virar conteúdo no próximo post.");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
