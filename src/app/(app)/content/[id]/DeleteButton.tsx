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
      className={`flex items-center gap-2 px-2 py-2.5 rounded-[11px] text-sm font-semibold transition-colors ${confirm ? "text-[#ff7a7a] bg-[rgba(255,80,80,0.08)]" : "text-[#636366] hover:text-[#ff7a7a] hover:bg-[rgba(255,80,80,0.08)]"}`}
    >
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      <span>{confirm ? "confirmar?" : "deletar"}</span>
    </button>
  );
}
