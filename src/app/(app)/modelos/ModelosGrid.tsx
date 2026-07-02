"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ConfirmModal from "@/components/ConfirmModal";

interface Template {
  id: string;
  image_url: string;
  name: string;
  count: number;
}

export default function ModelosGrid({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/templates/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("brand-kits").upload(path, file);
      if (error) return;
      const { data } = supabase.storage.from("brand-kits").getPublicUrl(path);
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: data.publicUrl }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function askDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete(id);
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    if (!id) return;
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const addBtn = (
    <button
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="h-11 px-5 rounded-xl bg-[#7B54FF] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 shrink-0"
    >
      {uploading ? (
        <svg className="animate-spin" width="17" height="17" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" /><path className="opacity-90" fill="#fff" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      ) : (
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      )}
      Novo modelo
    </button>
  );

  return (
    <div className="mt-8">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {templates.length === 0 ? (
        // Empty state
        <div className="rounded-3xl border border-white/[0.07] bg-[#131315] px-6 py-14 flex flex-col items-center text-center">
          <span className="h-16 w-16 rounded-2xl grid place-items-center mb-5" style={{ background: "rgba(123,84,255,0.14)", color: "#B9A2FF" }}>
            <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2 3 7l9 5 9-5-9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></svg>
          </span>
          <p className="text-lg font-bold mb-1">Nenhum modelo ainda</p>
          <p className="text-sm text-[#8A8A8E] max-w-sm mb-6">
            Suba um print de um post que você curtiu, ou abra um post gerado e toque em <b className="text-[#B9A2FF]">Usar como modelo</b>.
          </p>
          {addBtn}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[15px] font-bold text-[#8A8A8E]">{templates.length} {templates.length === 1 ? "modelo" : "modelos"}</p>
            {addBtn}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <Link key={t.id} href={`/modelos/${t.id}`} className="group">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.07] mb-2.5 transition-all group-hover:border-[#7B54FF]/40">
                  <img src={t.image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                  <button
                    onClick={(e) => askDelete(e, t.id)}
                    aria-label="Remover modelo"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff5050]/80 z-10"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm font-semibold truncate leading-tight">{t.name}</p>
                <p className="text-xs text-[#636366] mt-0.5">{t.count} {t.count === 1 ? "post" : "posts"}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Remover modelo?"
        message="Ele sai da sua biblioteca. Os posts já criados com ele continuam intactos."
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
