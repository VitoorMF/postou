import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

// Cria um "modelo" (âncora de estilo) na biblioteca da marca. Dois modos:
//  - { pack_id }   → copia a CAPA do post pro storage (durável) e salva. source='post'
//  - { image_url } → upload já feito pelo client (print do Instagram etc.). source='upload'
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  let imageUrl: string | null = null;
  let brandKitId: string | null = null;
  let source = "upload";
  let name: string | null = "Modelo enviado";

  if (body.pack_id) {
    // Confere posse do pack e pega a capa (slide 1).
    const { data: pack } = await admin.from("packs").select("user_id, brand_kit_id, title").eq("id", body.pack_id).single();
    if (!pack || pack.user_id !== user.id) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    name = (pack.title as string) ?? "Modelo";

    // "order" é palavra reservada no PostgREST (vira ORDER BY) — não filtra por ela;
    // busca os slides e acha a capa (order 1) no JS.
    const { data: slides } = await admin.from("slides").select("order, image_url").eq("pack_id", body.pack_id);
    const cover = (slides ?? []).find((s) => s.order === 1) ?? (slides ?? [])[0];
    if (!cover?.image_url) return NextResponse.json({ error: "Post sem capa pra virar modelo" }, { status: 400 });

    // Copia a imagem pro bucket de brand-kits (path templates/) — desacopla do pack.
    try {
      const res = await fetch(cover.image_url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const path = `${user.id}/templates/${crypto.randomUUID()}.png`;
      const { error: upErr } = await admin.storage.from("brand-kits").upload(path, buffer, { contentType: "image/png" });
      if (upErr) throw upErr;
      imageUrl = admin.storage.from("brand-kits").getPublicUrl(path).data.publicUrl;
    } catch (err) {
      console.error("Erro ao copiar capa pro modelo:", err);
      return NextResponse.json({ error: "Erro ao salvar a imagem do modelo" }, { status: 500 });
    }
    brandKitId = pack.brand_kit_id;
    source = "post";
  } else if (typeof body.image_url === "string" && body.image_url) {
    imageUrl = body.image_url;
    const { data: kit } = await supabase.from("brand_kits").select("id").eq("user_id", user.id).maybeSingle();
    brandKitId = kit?.id ?? null;
  } else {
    return NextResponse.json({ error: "pack_id ou image_url obrigatório" }, { status: 400 });
  }

  if (!brandKitId) return NextResponse.json({ error: "Brand kit não encontrado" }, { status: 400 });

  const { data: tpl, error } = await admin
    .from("templates")
    .insert({ brand_kit_id: brandKitId, user_id: user.id, image_url: imageUrl, source, name })
    .select("id, image_url")
    .single();

  if (error) {
    console.error("Erro ao salvar modelo:", error);
    return NextResponse.json({ error: "Erro ao salvar modelo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, template: tpl });
}

// Renomeia um modelo.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, name } = body as { id?: string; name?: string };
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "Nome muito longo (máx. 80 caracteres)" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tpl } = await admin.from("templates").select("user_id").eq("id", id).single();
  if (!tpl || tpl.user_id !== user.id) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { error } = await admin.from("templates").update({ name: name.trim() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao renomear" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Remove um modelo (linha + imagem no storage).
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tpl } = await admin.from("templates").select("user_id, image_url").eq("id", id).single();
  if (!tpl || tpl.user_id !== user.id) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // apaga a imagem do storage (só se estiver no nosso bucket)
  const match = (tpl.image_url as string)?.match(/\/brand-kits\/(.+)$/);
  if (match) await admin.storage.from("brand-kits").remove([match[1]]);

  await admin.from("templates").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
