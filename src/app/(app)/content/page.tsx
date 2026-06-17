import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import TypeFilter, { type TypeCounts } from "./TypeFilter";

interface Slide {
  id: string;
  order: number;
  image_url: string;
}

interface Pack {
  id: string;
  type: "carrossel" | "post" | "story";
  title: string;
  caption: string | null;
  cta: string | null;
  created_at: string;
  slides: Slide[];
}

const badgeColors: Record<Pack["type"], string> = {
  carrossel: "bg-[rgba(123,84,255,0.16)] text-[#B9A2FF]",
  post: "bg-[rgba(47,107,255,0.16)] text-[#85a8ff]",
  story: "bg-[rgba(48,196,107,0.16)] text-[#5fe09a]",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `gerado há ${h}h`;
  return `gerado há ${Math.floor(h / 24)}d`;
}

function PackCard({ id, type, title, caption, cta, created_at, slides }: Pack) {
  const isCarrossel = type === "carrossel";
  const cover = slides.find((s) => s.order === 1)?.image_url ?? slides[0]?.image_url ?? null;

  return (
    <div className="bg-[#1A1A1C] border border-white/[0.07] w-full rounded-[22px] overflow-hidden flex flex-col shrink-0 hover:border-white/[0.12] transition-colors">

      {/* Preview full-bleed (sem border) */}
      <div className="relative w-full aspect-[4/3] bg-[#202022]">
        <div className="absolute inset-0 shimmer-bg" />
        {cover && (
          <img src={cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" />
        )}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/55 backdrop-blur text-white text-xs font-semibold px-2 py-1 rounded-lg">
          {isCarrossel ? (
            <>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2" /><path d="M4 7v10M20 7v10" /></svg>
              {slides.length}
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              1
            </>
          )}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md lowercase ${badgeColors[type]}`}>{type}</span>
          <span className="text-xs text-[#636366]">
            {isCarrossel ? `${slides.length} imagens` : "1 imagem"} · {timeAgo(created_at)}
          </span>
        </div>
        <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
        {caption && <p className="text-sm text-[#8A8A8E] leading-snug line-clamp-2">{caption}</p>}
        {cta && (
          <div className="flex items-start gap-1.5 mt-0.5">
            <svg width="13" height="13" fill="none" stroke="#137EFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            <span className="text-[13px] text-[#137EFF] font-medium leading-snug">{cta}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4 mt-auto">
        <Link href={`/content/${id}`} className="flex-1 h-10 rounded-xl bg-[#262628] text-sm font-medium text-white flex items-center justify-center gap-2">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          ver
        </Link>
        <button className="flex-1 h-10 rounded-xl bg-[#137EFF] text-sm font-medium text-white flex items-center justify-center gap-2">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {isCarrossel ? "ZIP" : "baixar"}
        </button>
      </div>

    </div>
  );
}

function getDayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const toMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((toMidnight(now) - toMidnight(date)) / 86_400_000);
  if (diff === 0) return "HOJE";
  if (diff === 1) return "ONTEM";
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" }).toUpperCase();
}

const PAGE_SIZE = 10;

async function PacksList({ filter, count }: { filter?: string; count: number }) {
  const supabase = await createClient();

  let query = supabase
    .from("packs")
    .select("id, type, title, caption, cta, created_at, slides(id, order, image_url)")
    .order("created_at", { ascending: false })
    .limit(count + 1); // +1 pra detectar se há mais

  if (filter === "post" || filter === "story" || filter === "carrossel") {
    query = query.eq("type", filter);
  }

  const { data: allPacks } = await query;

  if (!allPacks || allPacks.length === 0) {
    return (
      <p className="text-sm text-[#636366] text-center mt-8">Nenhum conteúdo gerado ainda.</p>
    );
  }

  const hasMore = allPacks.length > count;
  const packs = hasMore ? allPacks.slice(0, count) : allPacks;

  const nextParams = new URLSearchParams();
  if (filter) nextParams.set("filter", filter);
  nextParams.set("count", String(count + PAGE_SIZE));

  const groups: { label: string; items: typeof packs }[] = [];
  for (const pack of packs) {
    const label = getDayLabel(pack.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(pack);
    } else {
      groups.push({ label, items: [pack] });
    }
  }

  return (
    <>
      {groups.map(({ label, items }) => (
        <div key={label} className="flex flex-col gap-4">
          <p className="text-xs font-bold text-[#636366] tracking-[0.12em] uppercase">{label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {items.map((pack) => (
              <PackCard key={pack.id} {...(pack as Pack)} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <Link
          href={`/content?${nextParams.toString()}`}
          scroll={false}
          className="self-center mt-2 flex items-center gap-2 px-5 h-10 rounded-full bg-[#161618] border border-white/[0.07] text-sm font-medium text-[#ccc] hover:bg-[#1A1A1C] transition-colors"
        >
          Carregar mais
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Link>
      )}
    </>
  );
}

function PacksSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-3 w-16 bg-[#202022] rounded-full animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#161618] border border-white/[0.07] w-full rounded-[22px] overflow-hidden flex flex-col animate-pulse">
            <div className="w-full aspect-[4/3] bg-[#202022]" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-24 bg-[#202022] rounded-full" />
              <div className="h-4 w-3/4 bg-[#202022] rounded-full" />
              <div className="h-3 w-1/2 bg-[#202022] rounded-full" />
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <div className="flex-1 h-10 bg-[#202022] rounded-xl" />
              <div className="flex-1 h-10 bg-[#202022] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function getCounts(): Promise<TypeCounts> {
  const supabase = await createClient();
  const countFor = (t: string) => supabase.from("packs").select("id", { count: "exact", head: true }).eq("type", t);
  const [pc, sc, cc] = await Promise.all([countFor("post"), countFor("story"), countFor("carrossel")]);
  return { post: pc.count ?? 0, story: sc.count ?? 0, carrossel: cc.count ?? 0 };
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ filter?: string; count?: string }> }) {
  const { filter, count } = await searchParams;
  const parsedCount = Math.max(PAGE_SIZE, parseInt(count ?? "", 10) || PAGE_SIZE);
  const counts = await getCounts();

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">

      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 max-w-[1100px] mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-[34px] font-extrabold tracking-[-0.03em]">Conteúdo</h1>
            <p className="text-base text-[#8A8A8E] font-medium mt-1">Seus posts gerados</p>
          </div>
          <TypeFilter mode="dropdown" counts={counts} className="hidden md:block" />
        </div>
        <TypeFilter mode="pills" counts={counts} className="md:hidden mt-4" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 flex flex-col gap-6 pb-4 max-w-[1100px] mx-auto w-full">
        <Suspense fallback={<PacksSkeleton />}>
          <PacksList filter={filter} count={parsedCount} />
        </Suspense>
      </div>

    </div>
  );
}
