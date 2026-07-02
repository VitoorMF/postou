import { createClient } from "@/lib/supabase-server";
import ModelosGrid from "./ModelosGrid";
import { MenuButton } from "@/components/NavDrawer";

export default async function ModelosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: templates }, { data: usage }] = await Promise.all([
    supabase
      .from("templates")
      .select("id, image_url, name, source, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("packs")
      .select("template_id")
      .eq("user_id", user!.id)
      .eq("status", "success")
      .not("template_id", "is", null),
  ]);

  // conta quantos posts foram gerados com cada modelo
  const counts: Record<string, number> = {};
  for (const p of usage ?? []) {
    const id = (p as { template_id: string }).template_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  const items = (templates ?? []).map((t) => ({
    id: t.id as string,
    image_url: t.image_url as string,
    name: (t.name as string) ?? "Modelo",
    count: counts[t.id as string] ?? 0,
  }));

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-10 pt-4 md:pt-12 pb-16">
          <div className="flex items-center gap-1.5"><MenuButton /><h1 className="text-3xl md:text-[34px] font-extrabold tracking-tight leading-none">Modelos</h1></div>
          <p className="text-[#8A8A8E] text-base lg:text-lg mt-2 font-medium max-w-xl">
            Salve um estilo que você curtiu e gere posts seguindo ele. O visual vai ficar parecido — mesma paleta, mesmo clima.
          </p>

          <ModelosGrid templates={items} />
        </div>
      </div>
    </div>
  );
}
