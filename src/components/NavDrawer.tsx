"use client";

import { createContext, useContext, useState } from "react";

// Estado do drawer mobile, compartilhado entre o Navbar (que renderiza o drawer)
// e o MenuButton (que as páginas colocam inline com o título).
const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function NavDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useNavDrawer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNavDrawer precisa estar dentro do NavDrawerProvider");
  return c;
}

// Hambúrguer pra usar inline com o título das páginas (só mobile).
export function MenuButton({ className = "" }: { className?: string }) {
  const { setOpen } = useNavDrawer();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Abrir menu"
      className={`md:hidden h-10 w-10 -ml-1.5 grid place-items-center text-[#E4E4E6] active:scale-90 transition-transform shrink-0 ${className}`}
    >
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>
    </button>
  );
}
