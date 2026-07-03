"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Rastreia navegações DENTRO do app desde o load. Se a pessoa abriu a página
// direto (link, reload, nova aba), não houve navegação interna → o back não tem
// pra onde voltar no app, então cai no fallback (a página pai).
const Ctx = createContext<() => boolean>(() => false);

export function NavHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const count = useRef(0);
  useEffect(() => { count.current += 1; }, [pathname]); // 1 no mount; >1 = navegou no app
  const canBack = useRef(() => count.current > 1);
  return <Ctx.Provider value={canBack.current}>{children}</Ctx.Provider>;
}

// Retorna um goBack: volta se houver histórico do app, senão vai pro fallback.
export function useSmartBack(fallback: string) {
  const router = useRouter();
  const canBack = useContext(Ctx);
  return () => {
    if (canBack()) router.back();
    else router.push(fallback);
  };
}
