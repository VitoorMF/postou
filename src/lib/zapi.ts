const BASE = "https://api.z-api.io";

function getCreds() {
  const id = process.env.Z_API_INSTANCE_ID;
  const token = process.env.Z_API_TOKEN;
  const clientToken = process.env.Z_API_CLIENT_TOKEN; // opcional, só se ativar Token de Segurança
  if (!id || !token) {
    throw new Error("Z-API credenciais ausentes (Z_API_INSTANCE_ID, Z_API_TOKEN)");
  }
  return { id, token, clientToken };
}

function url(path: string) {
  const { id, token } = getCreds();
  return `${BASE}/instances/${id}/token/${token}/${path}`;
}

async function call(path: string, body: Record<string, unknown>) {
  const { clientToken } = getCreds();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const res = await fetch(url(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Z-API ${path} falhou: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

// remove tudo que não é dígito + garante 55 no início (pra números BR)
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export async function sendText(phone: string, message: string) {
  return call("send-text", { phone: normalizePhone(phone), message });
}

export async function sendImage(phone: string, imageUrl: string, caption?: string) {
  return call("send-image", {
    phone: normalizePhone(phone),
    image: imageUrl,
    caption: caption ?? "",
  });
}

export async function sendButton(phone: string, message: string, buttons: { id: string; label: string }[]) {
  return call("send-button-list", {
    phone: normalizePhone(phone),
    message,
    buttonList: { buttons: buttons.map((b) => ({ id: b.id, label: b.label })) },
  });
}
