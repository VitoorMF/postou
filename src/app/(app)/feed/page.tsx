import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import NewUpdateForm from "@/components/NewUpdateForm";
import ScrollToBottom from "./ScrollToBottom";
import { type Category, categoryColors } from "@/lib/categories";
import BrandKitAvatar from "@/components/BrandKitAvatar";

interface Update {
  id: string;
  content: string;
  category: string;
  photo_urls: string[] | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `hoje, ${time}`;
  if (isYesterday) return `ontem, ${time}`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function UpdateCard({ id, content, category, photo_urls, created_at }: Update) {
  const badgeColor = categoryColors[category as Category] ?? categoryColors.geral;

  return (
    <Link href={`/feed/${id}`} className="bg-[#242424] w-full rounded-xl p-4 flex flex-col gap-3 shrink-0">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#888079]">{formatDate(created_at)}</span>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${badgeColor}`}>
          {category}
        </span>
      </div>
      <p className="text-white text-base leading-snug line-clamp-6 whitespace-pre-wrap">{content}</p>
      {photo_urls && photo_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
          {photo_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="h-20 w-20 object-cover rounded-lg shrink-0" />
          ))}
        </div>
      )}
    </Link>
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

async function UpdatesList() {
  const supabase = await createClient();
  const { data: updates } = await supabase
    .from("updates")
    .select("*")
    .order("created_at", { ascending: true });

  if (!updates || updates.length === 0) {
    return <p className="text-sm text-[#555] text-center mt-8">Nenhuma novidade ainda.</p>;
  }

  // Agrupa por dia
  const groups: { label: string; items: typeof updates }[] = [];
  for (const update of updates) {
    const label = getDayLabel(update.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(update);
    } else {
      groups.push({ label, items: [update] });
    }
  }

  return (
    <>
      {groups.map(({ label, items }) => (
        <div key={label} className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#555] tracking-widest">{label}</p>
          {items.map((item) => <UpdateCard key={item.id} {...item} />)}
        </div>
      ))}
      <ScrollToBottom />
    </>
  );
}

function UpdatesSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#242424] w-full rounded-xl p-4 flex flex-col gap-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-[#2e2e2e] rounded-full" />
            <div className="h-6 w-16 bg-[#2e2e2e] rounded-full" />
          </div>
          <div className="h-4 w-full bg-[#2e2e2e] rounded-full" />
          <div className="h-4 w-3/4 bg-[#2e2e2e] rounded-full" />
        </div>
      ))}
    </>
  );
}

export default function FeedPage() {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans justify-start items-center">

      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold">Novidades</h1>
            <p className="text-base text-[#888079]">O que aconteceu hoje?</p>
          </div>
          <BrandKitAvatar />
        </div>
      </div>

      <div id="feed-scroll" className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 flex flex-col gap-4 pb-4 mx-auto w-full max-w-4xl">
          <Suspense fallback={<UpdatesSkeleton />}>
            <UpdatesList />
          </Suspense>
        </div>
      </div>

      <NewUpdateForm />

    </div>
  );
}
