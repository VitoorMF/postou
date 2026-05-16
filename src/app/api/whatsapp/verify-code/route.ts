import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("whatsapp_verification_code, whatsapp_verification_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!kit?.whatsapp_verification_code) {
    return NextResponse.json({ error: "Nenhum código pendente" }, { status: 400 });
  }

  if (new Date(kit.whatsapp_verification_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Código expirado" }, { status: 400 });
  }

  if (String(code).trim() !== kit.whatsapp_verification_code) {
    return NextResponse.json({ error: "Código incorreto" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin
    .from("brand_kits")
    .update({
      whatsapp_verified: true,
      whatsapp_delivery_enabled: true,
      whatsapp_verification_code: null,
      whatsapp_verification_expires_at: null,
    })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
