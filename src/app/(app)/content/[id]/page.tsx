import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { use } from "react";
import BackButton from "./BackButton";
import DownloadButton from "./DownloadButton";
import CopyButton from "./CopyButton";
import DeleteButton from "./DeleteButton";

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
  const mainSlide = p.slides[0];

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
            {mainSlide?.image_url ? (
              <div className="w-full rounded-2xl overflow-hidden">
                <img
                  src={mainSlide.image_url}
                  alt={p.title}
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] rounded-2xl bg-[#1c1c1c] flex items-center justify-center">
                <span className="text-sm text-[#555]">Imagem não gerada</span>
              </div>
            )}

            {/* Slides do carrossel — abaixo da imagem no desktop */}
            {p.type === "carrossel" && p.slides.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {p.slides.map((s) => (
                  <div key={s.id} className="relative shrink-0 w-16 aspect-square rounded-xl bg-[#1c1c1c] overflow-hidden flex items-end justify-end p-1">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                    <span className="relative text-[10px] text-white/40">{s.order}</span>
                  </div>
                ))}
              </div>
            )}
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

            <DownloadButton imageUrl={mainSlide?.image_url ?? null} title={p.title} />
          </div>

        </div>
      </div>

    </div>
  );
}
