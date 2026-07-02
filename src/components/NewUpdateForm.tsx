"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function NewUpdateForm() {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [multiline, setMultiline] = useState(false); // 1 linha → recolhido; 2+ → expandido
  const taRef = useRef<HTMLTextAreaElement>(null);
  const baseRef = useRef(0); // altura de 1 linha (medida vazio)
  const router = useRouter();

  // captura a altura de uma linha no mount (pra decidir quando quebrou)
  useEffect(() => {
    if (taRef.current) baseRef.current = taRef.current.scrollHeight;
  }, []);

  function autoSize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const sh = el.scrollHeight;
    el.style.height = sh + "px";
    // recolhe SÓ quando vazio; expande ao quebrar linha (sticky → não oscila)
    if (!el.value.trim()) setMultiline(false);
    else if (baseRef.current && sh > baseRef.current + 8) setMultiline(true);
  }

  // recomputa a altura quando o layout troca (a largura do textarea muda)
  useEffect(() => { autoSize(); }, [multiline]);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if ((!content.trim() && images.length === 0) || loading) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let photo_urls: string[] | null = null;
    if (images.length > 0) {
      const uploads = await Promise.all(
        images.map(async ({ file }) => {
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("updates").upload(path, file);
          if (error) return null;
          return supabase.storage.from("updates").getPublicUrl(path).data.publicUrl;
        }),
      );
      photo_urls = uploads.filter(Boolean) as string[];
    }

    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), photo_urls }),
    });

    if (res.ok) {
      setContent("");
      setImages([]);
      setMultiline(false);
      router.refresh();
    }
    setLoading(false);
  }

  const canSend = content.trim().length > 0 || images.length > 0;

  const plusBtn = (
    <label className={`h-9 w-9 rounded-full flex items-center justify-center text-[#C7C7CC] shrink-0 transition-colors ${loading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-white/[0.07]"}`}>
      <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </label>
  );

  const sendBtn = (
    <button
      onClick={handleSubmit}
      disabled={loading || !canSend}
      aria-label="Anotar"
      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${canSend ? "bg-white text-black" : "bg-[#3A3A3A] text-[#8A8A8E]"}`}
    >
      {loading ? (
        <svg className="animate-spin" width="17" height="17" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      ) : (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
      )}
    </button>
  );

  return (
    <div className="w-full bg-transparent shrink-0 px-3 py-3">
      <div className="rounded-[26px] bg-[#1F1F1F] border border-white/[0.07] px-3 py-2">
        {images.length > 0 && (
          <div className="flex gap-2 px-1 pt-1 pb-2 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <div key={i} className="relative shrink-0">
                <img src={img.preview} className="h-16 w-16 rounded-xl object-cover" />
                <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#555] flex items-center justify-center">
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={multiline ? "" : "flex items-center gap-1.5"}>
          {!multiline && plusBtn}
          <textarea
            ref={taRef}
            rows={1}
            disabled={loading}
            maxLength={5000}
            className={`bg-transparent text-[15px] text-[#E4E4E6] placeholder:text-[#6e6e76] focus:outline-none resize-none overflow-y-auto leading-snug max-h-40 py-1.5 disabled:opacity-50 ${multiline ? "w-full px-1" : "flex-1 min-w-0"}`}
            placeholder="Um fato, um detalhe, uma ideia do negócio…"
            value={content}
            onChange={(e) => { setContent(e.target.value); autoSize(); }}
          />
          {!multiline && sendBtn}
        </div>

        {multiline && (
          <div className="flex items-center justify-between mt-1">
            {plusBtn}
            {sendBtn}
          </div>
        )}
      </div>
    </div>
  );
}
