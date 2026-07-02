import { createClient } from "@/lib/supabase-server";
import NoAccess from "@/components/NoAccess";
import { use } from "react";
import ModeloDetail from "./ModeloDetail";

interface Slide { order: number; image_url: string | null; }
interface Pack { id: string; type: string; title: string; created_at: string; slides: Slide[]; }

export default function ModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ModeloDetailServer id={id} />;
}

async function ModeloDetailServer({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from("templates")
    .select("id, image_url, name")
    .eq("id", id)
    .maybeSingle();

  // não é o dono / não existe
  if (!user || !template) return <NoAccess />;

  const { data: packsRaw } = await supabase
    .from("packs")
    .select("id, type, title, created_at, slides(order, image_url)")
    .eq("template_id", id)
    .eq("status", "success")
    .order("created_at", { ascending: false });

  const packs = ((packsRaw ?? []) as Pack[]).map((p) => ({
    id: p.id,
    type: p.type,
    title: p.title,
    cover: p.slides?.find((s) => s.order === 1)?.image_url ?? p.slides?.[0]?.image_url ?? null,
  }));

  return (
    <ModeloDetail
      template={{ id: template.id as string, image_url: template.image_url as string, name: (template.name as string) ?? "Modelo" }}
      posts={packs}
    />
  );
}
