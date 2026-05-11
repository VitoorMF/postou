"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function DeleteButton({ packId }: { packId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);

    const supabase = createClient();
    await supabase.from("slides").delete().eq("pack_id", packId);
    await supabase.from("packs").delete().eq("id", packId);

    router.replace("/content");
    router.refresh();
  }

  if (deleting) {
    return (
      <div className="h-9 w-9 flex items-center justify-center">
        <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirm(false)}
      className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-colors ${confirm ? "bg-red-500/20 text-red-400" : "bg-[#1c1c1c] text-[#555]"}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
      <span className="text-xs font-medium">{confirm ? "confirmar" : "deletar"}</span>
    </button>
  );
}
