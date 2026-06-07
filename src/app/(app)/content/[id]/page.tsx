import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { use } from "react";
import BackButton from "./BackButton";
import CopyButton from "./CopyButton";
import DeleteButton from "./DeleteButton";
import SlideViewer from "./SlideViewer";

interface Slide {
  id: string;
  order: number;
  image_url: string | null;
}

interface Pack {
  id: string;
  type: string;
  title: string;
  caption: string | null;
  cta: string | null;
  created_at: string;
  slides: Slide[];
}

const badgeColors: Record<string, string> = {
  carrossel: "bg-[#1a2a4a] text-blue-300",
  post:      "bg-[#2a1a4a] text-purple-300",
  story:     "bg-[#1a3a2a] text-emerald-300",
};

export default function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PackDetail id={id} />;
}

async function PackDetail({ id }: { id: string }) {
  const supabase = await createClient();

  const { data: pack } = await supabase
    .from("packs")
    .select("*, slides(*)")
    .eq("id", id)
    .order("order", { referencedTable: "slides", ascending: true })
    .single();

  if (!pack) notFound();

  const p = pack as Pack;

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      {/* Header */}
      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <BackButton />
          <DeleteButton packId={p.id} />
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${badgeColors[p.type] ?? badgeColors.post}`}>
            {p.type}
          </span>
          <span className="text-sm text-[#888079]">
            {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>

      {/* Conteúdo — mobile: coluna, desktop: duas colunas */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 md:items-start">

          {/* Coluna esquerda — imagem */}
          <div className="md:w-80 lg:w-96 md:sticky md:top-4 shrink-0">
            <SlideViewer slides={p.slides} title={p.title} type={p.type} />
          </div>

          {/* Coluna direita — metadados */}
          <div className="flex flex-col gap-5 flex-1 pb-4">

            {/* Título */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-[#555] tracking-widest">TÍTULO</p>
              <p className="text-xl font-semibold text-white leading-snug">{p.title}</p>
            </div>

            {/* Caption + CTA */}
            {p.caption && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#555] tracking-widest">LEGENDA</p>
                  <CopyButton text={p.cta ? `${p.caption}\n\n${p.cta}` : p.caption} />
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed">{p.caption}</p>
                {p.cta && (
                  <p className="text-sm text-[#137EFF] font-medium mt-1">{p.cta}</p>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
