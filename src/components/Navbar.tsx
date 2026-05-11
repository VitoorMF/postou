"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconFeed({ active }: { active: boolean }) {
  const c = active ? "white" : "#555";
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 20h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 16v2l1 1" />
    </svg>
  );
}

function IconContent({ active }: { active: boolean }) {
  const c = active ? "white" : "#555";
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  const c = active ? "white" : "#555";
  return (
    <svg width="22" height="22" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const tabs = [
  { label: "Novidades", href: "/feed", Icon: IconFeed },
  { label: "Conteúdo", href: "/content", Icon: IconContent },
  { label: "Configurar", href: "/settings", Icon: IconSettings },
];

const tabRoutes = ["/feed", "/content", "/settings"];

export default function Navbar() {
  const pathname = usePathname();

  if (!tabRoutes.includes(pathname)) return null;

  return (
    <nav className="
      flex shrink-0 bg-[#1a1a1a]
      flex-row w-full py-3 justify-around
      md:flex-col md:w-20 md:h-full md:py-8 md:justify-start md:gap-2 md:order-1
    ">
      {tabs.map(({ label, href, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-4 md:py-3 md:px-2 md:rounded-xl md:mx-2 md:hover:bg-white/5 transition-colors"
          >
            <Icon active={active} />
            <span className={`text-xs font-medium ${active ? "text-white" : "text-[#555]"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
