"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GenerateButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("error"); setMessage("Não autenticado"); return; }

    const { data: kit } = await supabase
      .from("brand_kits")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!kit) {
      setStatus("error");
      setMessage("Brand kit não encontrado");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pack`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ brand_kit_id: kit.id }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Erro desconhecido");
      return;
    }

    setStatus("success");
    setMessage(`${data.generated.length} pack(s) gerado(s)`);
    router.refresh();

    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <button
      onClick={handleGenerate}
      className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 h-11 rounded-full shadow-lg text-sm font-medium transition-all ${
        status === "loading" ? "bg-[#2b2b2b] text-[#888079]" :
        status === "success" ? "bg-emerald-600 text-white" :
        status === "error"   ? "bg-red-600 text-white" :
        "bg-[#137EFF] text-white"
      }`}
    >
      {status === "loading" ? (
        <>
          <svg className="animate-spin shrink-0" width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Gerando...
        </>
      ) : status === "success" ? (
        <>✓ {message}</>
      ) : status === "error" ? (
        <>✗ {message}</>
      ) : (
        <>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Gerar conteúdo
        </>
      )}
    </button>
  );
}
