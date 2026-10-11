import { NextResponse } from "next/server";
import { WHATSAPP_ENABLED } from "@/lib/features";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST() {
  if (!WHATSAPP_ENABLED) return NextResponse.json({ error: "WhatsApp desativado" }, { status: 410 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();
  await admin
    .from("brand_kits")
    .update({
      whatsapp_number: null,
      whatsapp_verified: false,
      whatsapp_delivery_enabled: false,
      whatsapp_verification_code: null,
      whatsapp_verification_expires_at: null,
    })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
