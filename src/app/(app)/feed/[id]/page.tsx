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

const CATEGORIES = Object.keys(categoryColors) as Category[];

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
  const [editCategory, setEditCategory] = useState<Category>("geral");
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
          setEditCategory((data.category as Category) ?? "geral");
        }
      });
  }, [id]);

  async function handleSave() {
    if (!update || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("updates").update({ content: editContent, category: editCategory }).eq("id", id);
    setUpdate({ ...update, content: editContent, category: editCategory });
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
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-4 md:px-8 pt-12 pb-16">

          {/* nav row */}
          <div className="flex items-center justify-between mb-7">
            <button onClick={() => router.back()} aria-label="Voltar" className="h-11 w-11 rounded-[13px] bg-[#161618] border border-white/[0.07] flex items-center justify-center text-white hover:bg-[#262628] active:scale-95 transition-all">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <div className="flex items-center gap-1.5">
              {/* Edit */}
              <button
                onClick={() => {
                  const next = !editing;
                  if (next) { setEditContent(update.content); setEditCategory((update.category as Category) ?? "geral"); }
                  setEditing(next);
                  setConfirmDelete(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-sm font-semibold transition-colors ${editing ? "text-[#137EFF] bg-[#137EFF]/10" : "text-[#636366] hover:text-white"}`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                editar
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
                disabled={deleting}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[11px] text-sm font-semibold transition-colors ${confirmDelete ? "text-[#ff7a7a] bg-[rgba(255,80,80,0.08)]" : "text-[#636366] hover:text-[#ff7a7a] hover:bg-[rgba(255,80,80,0.08)]"}`}
              >
                {deleting ? (
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                )}
                {confirmDelete ? "confirmar?" : "deletar"}
              </button>
            </div>
          </div>

          {/* meta */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-[#636366] font-medium">{formatDate(update.created_at)}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-lg lowercase ${categoryColors[update.category as Category] ?? categoryColors.geral}`}>
              {update.category}
            </span>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              {/* Categoria */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold tracking-[0.14em] uppercase text-[#636366]">Categoria</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEditCategory(cat)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold lowercase border transition-all ${editCategory === cat ? `${categoryColors[cat]} border-transparent` : "bg-[#242426] border-white/[0.12] text-[#8A8A8E] hover:text-white"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full bg-[#242426] border border-white/[0.12] rounded-[14px] px-4 py-3.5 text-white text-base leading-relaxed focus:outline-none focus:border-[#137EFF]/60 resize-none transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setEditContent(update.content); setEditCategory((update.category as Category) ?? "geral"); }}
                  className="flex-1 h-12 rounded-[14px] bg-[#262628] text-sm font-semibold text-[#aaa]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-12 rounded-[14px] bg-[#137EFF] text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[17px] md:text-lg leading-relaxed text-[#E4E4E6] whitespace-pre-wrap">{update.content}</p>
          )}

          {((update.photo_urls && update.photo_urls.length > 0) || editing) && (
            <div className="flex gap-3 flex-wrap mt-6">
              {update.photo_urls?.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setOpenImage(i)}
                  className="h-48 w-48 md:h-56 md:w-56 rounded-[16px] shrink-0 overflow-hidden border border-white/[0.07] hover:opacity-90 transition-opacity"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {editing && (
                <label className="h-48 w-48 md:h-56 md:w-56 rounded-[16px] shrink-0 bg-white/[0.02] border-[1.5px] border-dashed border-white/[0.12] hover:border-[#137EFF]/50 hover:bg-[#137EFF]/5 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-[#636366] hover:text-white">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-sm font-semibold">adicionar</span>
                </label>
              )}
            </div>
          )}

        </div>
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
                className="px-5 h-12 rounded-[14px] bg-[#262628] text-sm font-semibold text-white flex items-center gap-2 active:scale-[0.98] transition-transform"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Fechar
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className="px-5 h-12 rounded-[14px] bg-[#FF6B6B]/[0.12] border border-[#FF6B6B]/30 text-sm font-semibold text-[#FF6B6B] flex items-center gap-2 hover:bg-[#FF6B6B]/[0.2] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {deletingImage ? "Deletando..." : "Deletar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
