// Entrega do pack via WhatsApp (Z-API). Manda duas mensagens: a legenda LIMPA
// (pronta pra copiar e colar no Instagram) e, separada, o link da página do pack.

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export async function sendWhatsAppPack(
  phone: string,
  pack: { title: string; caption: string; cta: string | null; type: string },
  imageUrl: string | null,
  packId: string,
) {
  const instanceId = Deno.env.get("Z_API_INSTANCE_ID");
  const token = Deno.env.get("Z_API_TOKEN");
  const clientToken = Deno.env.get("Z_API_CLIENT_TOKEN");
  if (!instanceId || !token) {
    console.warn("Z-API credenciais ausentes — pulando envio WhatsApp");
    return;
  }

  const base = `https://api.z-api.io/instances/${instanceId}/token/${token}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const normalized = normalizePhone(phone);

  // 1) legenda LIMPA — pronta pra copiar e colar no Instagram (sem link nem assinatura)
  const caption = pack.type === "story"
    ? pack.title
    : `${pack.title}\n\n${pack.caption}${pack.cta ? `\n\n${pack.cta}` : ""}`;

  // 2) link da página do pack, em mensagem SEPARADA (pra não sujar a legenda copiada)
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://postou.app";
  const link = `${siteUrl}/content/${packId}`;
  const openLine = pack.type === "carrossel"
    ? `📲 Ver todos os slides e baixar:\n${link}`
    : `📲 Ver e baixar no app:\n${link}`;
  const linkMessage = `${openLine}\n\n_— Postou_`;

  const sendTextMsg = async (message: string) => {
    const res = await fetch(`${base}/send-text`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: normalized, message }),
    });
    if (!res.ok) console.error("Z-API send-text falhou:", await res.text());
  };

  try {
    if (imageUrl) {
      const res = await fetch(`${base}/send-image`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: normalized, image: imageUrl, caption }),
      });
      if (!res.ok) console.error("Z-API send-image falhou:", await res.text());
    } else {
      await sendTextMsg(caption);
    }
    await sendTextMsg(linkMessage); // link sempre em mensagem própria
  } catch (err) {
    console.error("Erro envio WhatsApp:", err);
  }
}
