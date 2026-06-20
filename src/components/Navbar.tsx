"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getLimits } from "@/lib/plans";

function IconHome({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IconFeed({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="8" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <line x1="11" y1="14.5" x2="17" y2="14.5" />
    </svg>
  );
}

function IconContent({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  );
}

function IconSettings({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const tabs = [
  { label: "Hoje", href: "/hoje", Icon: IconHome },
  { label: "Anotações", href: "/feed", Icon: IconFeed },
  { label: "Conteúdo", href: "/content", Icon: IconContent },
  { label: "Configurar", href: "/settings", Icon: IconSettings },
];

const tabRoutes = ["/hoje", "/feed", "/content", "/settings"];

const PLAN_NAMES: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro" };

export default function Navbar() {
  const pathname = usePathname();
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [manualUsed, setManualUsed] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: kit }, { data: u }] = await Promise.all([
        supabase.from("brand_kits").select("business_name, logo_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("users").select("plan, weekly_manual_count").eq("id", user.id).maybeSingle(),
      ]);
      if (kit?.business_name) setBrandName(kit.business_name);
      if (kit?.logo_url) setLogoUrl(kit.logo_url);
      if (u?.plan) setPlan(u.plan);
      if (typeof u?.weekly_manual_count === "number") setManualUsed(u.weekly_manual_count);
    });
  }, []);

  if (!tabRoutes.includes(pathname)) return null;

  const limits = getLimits(plan);
  const manualLeft = limits.manual === Infinity ? Infinity : Math.max(0, limits.manual - manualUsed);
  const atLimit = limits.manual !== Infinity && manualLeft === 0;

  return (
    <>
      {/* ===== Mobile: bottom bar ===== */}
      <nav className="md:hidden flex shrink-0 flex-row w-full justify-around order-2 bg-[#0C0C0E]/90 backdrop-blur-xl border-t border-white/[0.07] pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        {tabs.map(({ label, href, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex flex-1 flex-col items-center gap-1.5 pt-1 ${active ? "text-white" : "text-[#48484A]"}`}>
              <Icon size={24} />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ===== Desktop: sidebar ===== */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-full md:order-1 bg-[#0e0e0e] border-r border-white/[0.06] px-4 py-6">
        {/* Header marca */}
        <Link href="/settings/brand-kit" className="flex items-center gap-3 px-2 mb-8">
          <span className="h-11 w-11 rounded-full bg-white shrink-0 overflow-hidden grid place-items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg width="18" height="18" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight truncate">postou</p>
            <p className="text-[13px] text-[#8A8A8E] leading-tight truncate">{brandName || "Sua marca"}</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {tabs.map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[13px] transition-colors ${active ? "bg-[#262628]" : "hover:bg-white/[0.04]"}`}
              >
                <span className={active ? "text-[#137EFF]" : "text-[#8A8A8E]"}><Icon /></span>
                <span className={`text-[15px] font-semibold ${active ? "text-white" : "text-[#8A8A8E]"}`}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Card de plano (rodapé) */}
        <Link href="/settings/plans" className="mt-auto rounded-2xl border border-white/[0.07] bg-[#161618] p-4 block">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[14px] font-bold">Plano {PLAN_NAMES[plan] ?? "Free"}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${atLimit ? "bg-[#F0871E]/20 text-[#F0871E]" : "bg-[#7b54ff]/20 text-[#B9A2FF]"}`}>
              {atLimit ? "no limite" : "ativo"}
            </span>
          </div>
          <p className="text-[12.5px] text-[#636366] leading-snug mb-2">
            {limits.manual === Infinity
              ? "Gerações ilimitadas"
              : atLimit
              ? "Você usou todas as gerações manuais desta semana."
              : `Renova segunda · ${manualLeft} ${manualLeft === 1 ? "geração manual" : "gerações manuais"} restantes`}
          </p>
          <span className="text-[13px] font-semibold text-[#2F6BFF] flex items-center gap-1">
            Ver planos
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </span>
        </Link>
      </aside>
    </>
  );
}
