import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Atualiza campos do pack (legenda, status "postado", avaliação).
// Escrita via admin client com checagem de posse — nunca confia no client.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.caption === "string") patch.caption = body.caption.trim();
  if (typeof body.cta === "string") patch.cta = body.cta.trim() || null;
  else if (body.cta === null) patch.cta = null;
  if (typeof body.posted === "boolean") patch.posted_at = body.posted ? new Date().toISOString() : null;
  if (body.rating === 1 || body.rating === -1 || body.rating === null) patch.rating = body.rating;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: pack } = await admin.from("packs").select("user_id").eq("id", id).single();
  if (!pack || pack.user_id !== user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const { error } = await admin.from("packs").update(patch).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar pack:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
