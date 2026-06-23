"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Atualiza a página (server components) a cada X ms enquanto montado.
// Renderize condicionalmente (ex: só quando há algo "pending") pra parar sozinho.
export default function Poller({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
