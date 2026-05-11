"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { type Category, categoryColors } from "@/lib/categories";

interface Update {
  id: string;
  content: string;
  category: string;
  photo_urls: string[] | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `hoje, ${time}`;
  if (isYesterday) return `ontem, ${time}`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [update, setUpdate] = useState<Update | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openImage, setOpenImage] = useState<number | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const router = useRouter();

  // ESC fecha o modal
  useEffect(() => {
    if (openImage === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenImage(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openImage]);

  async function handleDeleteImage() {
    if (openImage === null || !update?.photo_urls || deletingImage) return;
    setDeletingImage(true);
    const supabase = createClient();
    const url = update.photo_urls[openImage];
    const newPhotos = update.photo_urls.filter((_, i) => i !== openImage);

    // Atualiza o update
    await supabase.from("updates").update({ photo_urls: newPhotos.length > 0 ? newPhotos : null }).eq("id", id);

    // Tenta apagar do storage (extrai path após "/updates/")
    const match = url.match(/\/updates\/(.+)$/);
    if (match) await supabase.storage.from("updates").remove([match[1]]);

    setUpdate({ ...update, photo_urls: newPhotos.length > 0 ? newPhotos : null });
    setOpenImage(null);
    setDeletingImage(false);
  }

  async function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !update) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("updates").upload(path, file);
    if (error) return;

    const { data } = supabase.storage.from("updates").getPublicUrl(path);
    const newPhotos = [...(update.photo_urls ?? []), data.publicUrl];
    await supabase.from("updates").update({ photo_urls: newPhotos }).eq("id", id);
    setUpdate({ ...update, photo_urls: newPhotos });
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("updates")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUpdate(data);
          setEditContent(data.content);
        }
      });
  }, [id]);

  async function handleSave() {
    if (!update || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("updates").update({ content: editContent }).eq("id", id);
    setUpdate({ ...update, content: editContent });
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("updates").delete().eq("id", id);
    router.replace("/feed");
    router.refresh();
  }

  if (!update) return null;

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="h-9 w-9 rounded-full bg-[#1c1c1c] flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {/* Edit */}
            <button
              onClick={() => { setEditing(!editing); setConfirmDelete(false); }}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-colors ${editing ? "bg-[#137EFF]/20 text-[#137EFF]" : "bg-[#1c1c1c] text-[#555]"}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="text-xs font-medium">editar</span>
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              disabled={deleting}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-colors ${confirmDelete ? "bg-red-500/20 text-red-400" : "bg-[#1c1c1c] text-[#555]"}`}
            >
              {deleting ? (
                <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              )}
              <span className="text-xs font-medium">{confirmDelete ? "confirmar" : "deletar"}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-[#888079]">{formatDate(update.created_at)}</span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${categoryColors[update.category as Category] ?? categoryColors.geral}`}>
            {update.category}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-4 pb-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              autoFocus
              className="w-full bg-[#1c1c1c] rounded-xl px-4 py-3 text-white text-base leading-relaxed focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setEditContent(update.content); }}
                className="flex-1 h-11 rounded-full bg-[#2b2b2b] text-sm font-medium text-[#888079]"
              >
                cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-full bg-[#137EFF] text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "salvando..." : "salvar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{update.content}</p>
        )}

        {((update.photo_urls && update.photo_urls.length > 0) || editing) && (
          <div className="flex gap-3 flex-wrap">
            {update.photo_urls?.map((url, i) => (
              <button
                key={i}
                onClick={() => setOpenImage(i)}
                className="h-56 w-56 rounded-xl shrink-0 overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            {editing && (
              <label className="h-56 w-56 rounded-xl shrink-0 bg-[#1c1c1c] border border-dashed border-[#3a3a3a] hover:border-[#555] hover:bg-[#202020] transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-[#666]">
                <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-xs font-medium">adicionar</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Modal de imagem expandida */}
      {openImage !== null && update.photo_urls && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpenImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-full flex flex-col gap-4 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={update.photo_urls[openImage]}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOpenImage(null)}
                className="px-5 h-11 rounded-full bg-[#2b2b2b] text-sm font-medium text-white flex items-center gap-2"
              >
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                fechar
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className="px-5 h-11 rounded-full bg-red-600 hover:bg-red-700 text-sm font-medium text-white flex items-center gap-2 disabled:opacity-60"
              >
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                {deletingImage ? "deletando..." : "deletar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
