"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function NewUpdateForm() {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImages((prev) => [...prev, { file, preview }]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!content.trim() && images.length === 0) return;
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    let photo_urls: string[] | null = null;

    if (images.length > 0) {
      const uploads = await Promise.all(
        images.map(async ({ file }) => {
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("updates").upload(path, file);
          if (error) return null;
          const { data } = supabase.storage.from("updates").getPublicUrl(path);
          return data.publicUrl;
        })
      );
      photo_urls = uploads.filter(Boolean) as string[];
    }

    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        photo_urls,
      }),
    });

    if (res.ok) {
      setContent("");
      setImages([]);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="w-full  bg-[#141414] shrink-0">
      {images.length > 0 && (
        <div className="flex gap-2 px-3 pt-3 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <div key={i} className="relative shrink-0">
              <img src={img.preview} className="h-20 w-20 rounded-xl object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#555] flex items-center justify-center"
              >
                <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="px-3 py-3 gap-2 flex items-end">
        <textarea
          rows={1}
          disabled={loading}
          className="bg-[#1F1F1F] w-full min-h-12 max-h-36 px-4 py-3 rounded-2xl text-[#888079] placeholder:text-[#888079] focus:outline-none resize-none overflow-y-auto leading-snug disabled:opacity-50 transition-opacity"
          placeholder="O que aconteceu hoje?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
        />
        <label className={`h-12 w-12 rounded-[20px] bg-[#2B2B2B] flex items-center justify-center shrink-0 transition-opacity ${loading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <svg width="18" height="18" fill="none" stroke="#888079" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </label>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-12 w-12 rounded-[20px] bg-[#137EFF] flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
