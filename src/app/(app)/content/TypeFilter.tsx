"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type TypeCounts = { post: number; story: number; carrossel: number };

const OPTIONS = [
  { label: "Tudo", value: "all", dot: null as string | null, key: null as keyof TypeCounts | null },
  { label: "Posts", value: "post", dot: "#137EFF", key: "post" as const },
  { label: "Stories", value: "story", dot: "#30C46B", key: "story" as const },
  { label: "Carrosséis", value: "carrossel", dot: "#7B54FF", key: "carrossel" as const },
];

export default function TypeFilter({ counts, mode, className = "" }: { counts: TypeCounts; mode: "pills" | "dropdown"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("filter") ?? "all";
  const total = counts.post + counts.story + counts.carrossel;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("filter");
    else params.set("filter", value);
    params.delete("count"); // reseta paginação
    router.push(`/content?${params.toString()}`);
    setOpen(false);
  }

  // só mostra tipos que têm conteúdo (Tudo sempre aparece)
  const opts = OPTIONS.filter((o) => o.key === null || counts[o.key] > 0);
  const countOf = (o: (typeof OPTIONS)[number]) => (o.key === null ? total : counts[o.key]);
  const activeLabel = OPTIONS.find((o) => o.value === active)?.label ?? "Tudo";

  if (mode === "pills") {
    return (
      <div className={`flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 ${className}`}>
        {opts.map((o) => {
          const isActive = active === o.value;
          return (
            <button
              key={o.value}
              onClick={() => select(o.value)}
              className={`shrink-0 h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive ? "bg-white text-black" : "bg-[#1A1A1C] border border-white/[0.07] text-[#aaa]"
              }`}
            >
              {o.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: o.dot }} />}
              {o.label}
              {o.key && <span className={isActive ? "text-black/40" : "text-[#636366]"}>{countOf(o)}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3.5 rounded-full bg-[#1A1A1C] border border-white/[0.07] flex items-center gap-2 text-sm font-medium text-[#ccc]"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 6h18M7 12h10M11 18h2" />
        </svg>
        {activeLabel}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-[#1A1A1C] border border-white/[0.08] rounded-2xl shadow-xl z-50 min-w-[210px] p-1.5">
          {opts.map((o) => {
            const isActive = active === o.value;
            return (
              <button
                key={o.value}
                onClick={() => select(o.value)}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 hover:bg-[#262628] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: o.dot ?? "transparent" }} />
                <span className={`flex-1 text-left text-sm ${isActive ? "text-white font-semibold" : "text-[#aaa]"}`}>{o.label}</span>
                {o.key && <span className="text-sm text-[#636366]">{countOf(o)}</span>}
                {isActive && (
                  <svg width="15" height="15" fill="none" stroke="#137EFF" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
