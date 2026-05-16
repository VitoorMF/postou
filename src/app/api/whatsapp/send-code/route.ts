import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendText, normalizePhone } from "@/lib/zapi";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: "Número obrigatório" }, { status: 400 });

  const normalized = normalizePhone(phone);
  if (normalized.length < 12 || normalized.length > 13) {
    return NextResponse.json({ error: "Número inválido" }, { status: 400 });
  }

  // gera código 6 dígitos
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // salva no brand_kit (usa admin pra contornar RLS se necessário)
  const admin = createAdminClient();
  const { error } = await admin
    .from("brand_kits")
    .update({
      whatsapp_number: `+${normalized}`,
      whatsapp_verified: false,
      whatsapp_verification_code: code,
      whatsapp_verification_expires_at: expiresAt,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao salvar whatsapp:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  // manda código via Z-API
  try {
    await sendText(
      normalized,
      `*Postou* — seu código de verificação:\n\n*${code}*\n\nO código expira em 10 minutos.`
    );
  } catch (err) {
    console.error("Erro Z-API:", err);
    return NextResponse.json({ error: "Erro ao enviar código" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
