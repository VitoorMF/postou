"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Mostrado quando o usuário logado tenta abrir um conteúdo que não é da conta dele
// (link da entrega aberto na conta errada, ou link de outra pessoa). O dado em si
// já é bloqueado pelo RLS — isto é só UX.
export default function NoAccess() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchAccount() {
    if (busy) return;
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/entrar");
  }

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white font-sans flex items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-[#137EFF]/12 grid place-items-center">
          <svg width="26" height="26" fill="none" stroke="#137EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Conteúdo indisponível</h1>
        <p className="text-[#8A8A8E] mt-3 leading-relaxed">
          Esse conteúdo não está nesta conta. Se for seu, entre com a conta certa pra ver.
        </p>
        <div className="flex flex-col gap-2.5 mt-7">
          <button
            onClick={switchAccount}
            disabled={busy}
            className="h-12 rounded-2xl bg-[#137EFF] text-white text-[15px] font-semibold disabled:opacity-60 active:scale-[0.99] transition-transform"
          >
            {busy ? "Saindo…" : "Entrar com outra conta"}
          </button>
          <Link
            href="/hoje"
            className="h-12 rounded-2xl border border-white/[0.12] text-white text-[15px] font-semibold flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            Ir pro início
          </Link>
        </div>
      </div>
    </div>
  );
}
