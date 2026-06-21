import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { use } from "react";
import BackButton from "./BackButton";
import DeleteButton from "./DeleteButton";
import SlideViewer from "./SlideViewer";
import CaptionEditor from "./CaptionEditor";
import ContentActions from "./ContentActions";
import RatingButtons from "./RatingButtons";

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
  posted_at: string | null;
  rating: number | null;
  slides: Slide[];
}

const badgeColors: Record<string, string> = {
  carrossel: "bg-[rgba(123,84,255,0.16)] text-[#B9A2FF]",
  post:      "bg-[rgba(47,107,255,0.16)] text-[#85a8ff]",
  story:     "bg-[rgba(48,196,107,0.16)] text-[#5fe09a]",
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
  const ordered = [...p.slides].sort((a, b) => a.order - b.order);
  const shareImages = ordered.map((s) => s.image_url).filter((u): u is string => !!u);
  const isStory = p.type === "story";
  const shareText = isStory
    ? p.title
    : `${p.title}${p.caption ? `\n\n${p.caption}` : ""}${p.cta ? `\n\n${p.cta}` : ""}`;

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1180px] mx-auto px-4 md:px-12 pt-12 pb-16">

          {/* nav-row */}
          <div className="flex items-center justify-between mb-7">
            <BackButton />
            <DeleteButton packId={p.id} />
          </div>

          {/* meta-row */}
          <div className="flex items-center justify-between mb-5">
            <span className={`text-[13px] font-bold px-3.5 py-1.5 rounded-[10px] lowercase ${badgeColors[p.type] ?? badgeColors.post}`}>
              {p.type}
            </span>
            <span className="text-base text-[#636366] font-semibold">
              {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          </div>

          {/* detail — mobile: coluna, desktop: duas colunas */}
          <div className="grid md:grid-cols-[minmax(0,430px)_1fr] gap-7 md:gap-12 items-start">

            {/* Coluna esquerda — imagem */}
            <div className="md:sticky md:top-4">
              <SlideViewer slides={p.slides} title={p.title} type={p.type} />
            </div>

            {/* Coluna direita — metadados */}
            <div className="flex flex-col max-w-[760px] min-w-0">

              {/* Título */}
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3">Título</p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-[-0.025em] leading-[1.12] mb-7 text-balance">{p.title}</h1>

              {/* Legenda — copiar / editar / regenerar (story não tem legenda) */}
              {!isStory && (
                <div className="mb-7">
                  <CaptionEditor packId={p.id} caption={p.caption} cta={p.cta} />
                </div>
              )}

              {/* Ações */}
              <ContentActions packId={p.id} imageUrls={shareImages} title={p.title} text={shareText} initialPosted={!!p.posted_at} />

              {/* Qualidade */}
              <RatingButtons packId={p.id} initialRating={p.rating ?? null} />

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
