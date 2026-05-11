"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "Tudo", value: "all" },
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "Esta semana", value: "week" },
];

export default function DateFilter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("filter") ?? "all";

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
    router.push(`/content?${params.toString()}`);
    setOpen(false);
  }

  const activeLabel = OPTIONS.find((o) => o.value === active)?.label ?? "Tudo";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-full bg-[#1c1c1c] flex items-center gap-2 text-sm font-medium text-[#888079]"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 6h18M7 12h10M11 18h2" />
        </svg>
        {activeLabel}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-[#1c1c1c] rounded-2xl overflow-hidden shadow-xl z-50 min-w-[140px]">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${active === opt.value ? "text-white font-medium" : "text-[#888079]"} hover:bg-[#2b2b2b]`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
