import { createClient } from "@/lib/supabase-server";
import NoAccess from "@/components/NoAccess";
import { use } from "react";
import BackButton from "./BackButton";
import DeleteButton from "./DeleteButton";
import SlideViewer from "./SlideViewer";
import CaptionEditor from "./CaptionEditor";
import ContentActions from "./ContentActions";
import RatingButtons from "./RatingButtons";
import Poller from "@/components/Poller";

interface Slide {
  id: string;
  order: number;
  image_url: string | null;
}

interface Pack {
  id: string;
  user_id: string;
  type: string;
  title: string;
  caption: string | null;
  cta: string | null;
  created_at: string;
  posted_at: string | null;
  rating: number | null;
  status: string;
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

  const { data: { user } } = await supabase.auth.getUser();

  const { data: pack } = await supabase
    .from("packs")
    .select("*, slides(*)")
    .eq("id", id)
    .order("order", { referencedTable: "slides", ascending: true })
    .single();

  // não é o dono (ou não existe) → tela "conteúdo indisponível nesta conta"
  if (!user || !pack || (pack as Pack).user_id !== user.id) return <NoAccess />;

  const p = pack as Pack;

  // Ainda gerando → estado "sendo gerada" (a página se atualiza sozinha quando fica pronto)
  if (p.status === "pending") return <GeneratingDetail p={p} />;

  // Falhou (ex: timeout do edge mata a função antes de finalizar) → tela de erro
  if (p.status === "failed") return <FailedDetail p={p} />;

  const ordered = [...p.slides].sort((a, b) => a.order - b.order);
  const shareImages = ordered.map((s) => s.image_url).filter((u): u is string => !!u);
  const isStory = p.type === "story";
  // legenda pro clipboard/compartilhar — só caption + cta (sem o título)
  const shareText = [p.caption, p.cta].filter(Boolean).join("\n\n");

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

// Estado de "sendo gerada" — mostrado enquanto o pack está pending.
function GeneratingDetail({ p }: { p: Pack }) {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1180px] mx-auto px-4 md:px-12 pt-12 pb-16">

          <div className="flex items-center justify-between mb-7">
            <BackButton />
          </div>

          <div className="flex items-center justify-between mb-5">
            <span className={`text-[13px] font-bold px-3.5 py-1.5 rounded-[10px] lowercase ${badgeColors[p.type] ?? badgeColors.post}`}>
              {p.type}
            </span>
            <span className="text-base text-[#636366] font-semibold">
              {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          </div>

          <div className="grid md:grid-cols-[minmax(0,430px)_1fr] gap-7 md:gap-12 items-start">

            {/* imagem em geração */}
            <div className="md:sticky md:top-4">
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.07]">
                <div className="absolute inset-0 shimmer-bg" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <svg className="animate-spin" width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#137EFF" strokeWidth="3" />
                    <path className="opacity-90" fill="#137EFF" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <p className="text-sm font-bold text-white">Gerando seu conteúdo…</p>
                  <p className="text-xs text-[#8A8A8E]">Fica pronto em alguns minutos. Esta página atualiza sozinha.</p>
                </div>
              </div>
            </div>

            {/* metadados (skeleton) */}
            <div className="flex flex-col max-w-[760px] min-w-0">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3">Título</p>
              {p.title ? (
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-[-0.025em] leading-[1.12] mb-7 text-balance">{p.title}</h1>
              ) : (
                <div className="h-8 w-2/3 rounded-lg bg-[#1A1A1C] animate-pulse mb-7" />
              )}
              <div className="flex flex-col gap-2.5">
                <div className="h-4 w-full rounded bg-[#1A1A1C] animate-pulse" />
                <div className="h-4 w-11/12 rounded bg-[#1A1A1C] animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-[#1A1A1C] animate-pulse" />
              </div>
            </div>

          </div>
        </div>
      </div>
      <Poller intervalMs={6000} />
    </div>
  );
}

// Estado de falha — a geração não terminou (erro ou timeout do edge). Sem Poller.
function FailedDetail({ p }: { p: Pack }) {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1180px] mx-auto px-4 md:px-12 pt-12 pb-16">

          <div className="flex items-center justify-between mb-7">
            <BackButton />
            <DeleteButton packId={p.id} />
          </div>

          <div className="max-w-md mx-auto text-center mt-16 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-[#F0871E]/12 grid place-items-center mb-5">
              <svg width="26" height="26" fill="none" stroke="#F0871E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Não foi possível gerar</h1>
            <p className="text-[#8A8A8E] mt-3 leading-relaxed">
              A geração deste conteúdo não terminou — normalmente porque demorou demais. Pode remover e gerar de novo.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
