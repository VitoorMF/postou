import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import GenerateButton from "@/components/GenerateButton";
import DateFilter from "./DateFilter";

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
  carrossel: "bg-[#1a2a4a] text-blue-300",
  post: "bg-[#2a1a4a] text-purple-300",
  story: "bg-[#1a3a2a] text-emerald-300",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `gerado há ${h}h`;
  return `gerado há ${Math.floor(h / 24)}d`;
}

function PackCard({ id, type, title, caption, cta, created_at, slides }: Pack) {
  const isCarrossel = type === "carrossel";
  const preview = slides.slice(0, 3);
  const extra = slides.length - 3;

  return (
    <div className="bg-[#1c1c1c] w-full rounded-2xl p-4 flex flex-col gap-3 shrink-0 ">

      {isCarrossel ? (
        <div className="flex gap-2 items-center">
          {preview.map((s, i) => (
            <div key={s.id} className="relative flex-1 aspect-square rounded-xl bg-[#242424] flex items-end justify-end p-1 overflow-hidden shimmer">
              {s.image_url ? (
                <img src={s.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              ) : null}
              <span className="relative text-[10px] text-white/30">{i + 1}</span>
            </div>
          ))}
          {extra > 0 && (
            <span className="text-sm text-[#888079] shrink-0">+{extra}</span>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[4/3] rounded-xl bg-[#242424] relative flex items-end justify-end p-2 overflow-hidden shimmer">
          {slides[0]?.image_url ? (
            <img src={slides[0].image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
          ) : null}
          <span className="relative text-xs text-white/30">1</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[type]}`}>
            {type}
          </span>
          <span className="text-xs text-[#555]">
            {isCarrossel ? `${slides.length} slides` : "1 imagem"} · {timeAgo(created_at)}
          </span>
        </div>
        <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
        {caption && (
          <p className="text-sm text-[#888079] leading-snug line-clamp-2">{caption}</p>
        )}
        {cta && (
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="#137EFF" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-xs text-[#137EFF] font-medium">{cta}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/content/${id}`} className="flex-1 h-10 rounded-full bg-[#2b2b2b] text-sm font-medium text-white flex items-center justify-center">
          {isCarrossel ? "ver slides" : "ver"}
        </Link>
        <button className="flex-1 h-10 rounded-full bg-[#137EFF] text-sm font-medium text-white">
          {isCarrossel ? "baixar ZIP" : "baixar"}
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

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();

  let query = supabase
    .from("packs")
    .select("id, type, title, caption, cta, created_at, slides(id, order, image_url)")
    .order("created_at", { ascending: false })
    .limit(count + 1); // +1 pra detectar se há mais

  if (filter === "today") {
    query = query.gte("created_at", startOfDay(now));
  } else if (filter === "yesterday") {
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    query = query.gte("created_at", startOfDay(yesterday)).lt("created_at", startOfDay(now));
  } else if (filter === "week") {
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    query = query.gte("created_at", startOfDay(weekAgo));
  }

  const { data: allPacks } = await query;

  if (!allPacks || allPacks.length === 0) {
    return (
      <p className="text-sm text-[#555] text-center mt-8">Nenhum conteúdo gerado ainda.</p>
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
          <p className="text-xs font-semibold text-[#555] tracking-widest">{label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          className="self-center mt-2 flex items-center gap-2 px-5 h-10 rounded-full bg-[#1c1c1c] text-sm font-medium text-[#ccc] hover:bg-[#242424] transition-colors"
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
    <>
      {[1, 2].map((i) => (
        <div key={i} className="bg-[#1c1c1c] w-full rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
          <div className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-1 aspect-square rounded-xl bg-[#2b2b2b]" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-20 bg-[#2b2b2b] rounded-full" />
            <div className="h-4 w-3/4 bg-[#2b2b2b] rounded-full" />
            <div className="h-3 w-1/2 bg-[#2b2b2b] rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-[#2b2b2b] rounded-full" />
            <div className="flex-1 h-10 bg-[#2b2b2b] rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ filter?: string; count?: string }> }) {
  const { filter, count } = await searchParams;
  const parsedCount = Math.max(PAGE_SIZE, parseInt(count ?? "", 10) || PAGE_SIZE);

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 pt-12 pb-4 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold">Conteúdo</h1>
            <p className="text-base text-[#888079]">Seus posts gerados</p>
          </div>
          <DateFilter />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 flex flex-col gap-6 pb-4 ">
        <Suspense fallback={<PacksSkeleton />}>
          <PacksList filter={filter} count={parsedCount} />
        </Suspense>
      </div>

      <GenerateButton />

    </div>
  );
}
