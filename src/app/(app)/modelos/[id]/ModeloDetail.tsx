"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGeneration } from "@/components/GenerationProvider";
import ConfirmModal from "@/components/ConfirmModal";
import { useSmartBack } from "@/components/SmartBack";

interface Template { id: string; image_url: string; name: string; }
interface Post { id: string; type: string; title: string; cover: string | null; }

type Format = "post" | "story" | "carrossel";
const FORMATS: { key: Format; label: string }[] = [
  { key: "post", label: "Post" },
  { key: "story", label: "Story" },
  { key: "carrossel", label: "Carrossel" },
];

type Filter = "all" | Format;

const typeBadge: Record<string, string> = {
  carrossel: "bg-[rgba(123,84,255,0.16)] text-[#B9A2FF]",
  post: "bg-[rgba(47,107,255,0.16)] text-[#85a8ff]",
  story: "bg-[rgba(48,196,107,0.16)] text-[#5fe09a]",
};

export default function ModeloDetail({ template, posts }: { template: Template; posts: Post[] }) {
  const router = useRouter();
  const goBack = useSmartBack("/modelos");
  const { generate } = useGeneration();
  const [genOpen, setGenOpen] = useState(false);
  const [format, setFormat] = useState<Format>("post");
  const [theme, setTheme] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [name, setName] = useState(template.name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(template.name);

  async function saveName() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === name) return;
    const res = await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: template.id, name: trimmed }),
    });
    if (res.ok) setName(trimmed);
  }

  const counts = {
    post: posts.filter((p) => p.type === "post").length,
    story: posts.filter((p) => p.type === "story").length,
    carrossel: posts.filter((p) => p.type === "carrossel").length,
  };
  const shown = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  function fireGenerate() {
    generate({ format, templateId: template.id, theme: theme.trim() || undefined });
    setGenOpen(false);
    setTheme("");
    router.push("/hoje");
  }

  async function remove() {
    setConfirmDel(false);
    setDeleting(true);
    const res = await fetch(`/api/templates?id=${template.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/modelos"); router.refresh(); }
    else setDeleting(false);
  }

  const tabs: { key: Filter; label: string; count?: number; dot?: string }[] = [
    { key: "all", label: "Tudo" },
    { key: "post", label: "Posts", count: counts.post, dot: "#2F6BFF" },
    { key: "story", label: "Stories", count: counts.story, dot: "#30C46B" },
    { key: "carrossel", label: "Carrosséis", count: counts.carrossel, dot: "#7B54FF" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-10 pt-12 pb-16">

          {/* nav */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={goBack} aria-label="Voltar" className="h-11 w-11 rounded-[13px] bg-[#161618] border border-white/[0.07] grid place-items-center hover:bg-[#262628] transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => setConfirmDel(true)} disabled={deleting} className="text-sm font-semibold text-[#636366] hover:text-[#ff7a7a] transition-colors flex items-center gap-1.5 disabled:opacity-50">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              deletar
            </button>
          </div>

          {/* header: preview + info */}
          <div className="flex flex-col sm:flex-row gap-6 mb-10">
            <div className="w-[200px] shrink-0 rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.07]">
              <img src={template.image_url} alt={template.name} className="w-full aspect-[4/5] object-cover" />
            </div>
            <div className="flex flex-col min-w-0 pt-1">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-2">Modelo</p>
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  maxLength={80}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  className="text-3xl font-extrabold tracking-tight leading-tight bg-transparent border-b-2 border-[#7B54FF]/60 outline-none mb-1 w-full max-w-md"
                />
              ) : (
                <div className="flex items-center gap-2.5 mb-1 group/name">
                  <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-balance">{name}</h1>
                  <button
                    onClick={() => { setDraft(name); setEditing(true); }}
                    aria-label="Editar nome"
                    className="text-[#636366] hover:text-[#B9A2FF] transition-colors shrink-0"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </button>
                </div>
              )}
              <p className="text-[#8A8A8E] text-sm mb-6">{posts.length} {posts.length === 1 ? "post criado" : "posts criados"} com este estilo</p>
              <button
                onClick={() => { setGenOpen(true); setFormat("post"); }}
                className="h-12 px-6 rounded-2xl bg-[#7B54FF] text-white text-[15px] font-bold flex items-center justify-center gap-2 w-full sm:w-auto active:scale-[0.98] transition-transform"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Novo post
              </button>
            </div>
          </div>

          {/* conteúdo criado */}
          <p className="text-[15px] font-bold mb-4">Conteúdo criado</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none mb-6 -mx-5 px-5 lg:mx-0 lg:px-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${filter === t.key ? "bg-white text-[#0C0C0E] border-transparent" : "bg-[#1A1A1C] text-[#8A8A8E] border-white/[0.08] hover:text-white"}`}
              >
                {t.dot && <span className="w-2 h-2 rounded-full" style={{ background: t.dot }} />}
                {t.label}
                {typeof t.count === "number" && <span className="text-[#636366]">{t.count}</span>}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#131315] p-10 text-center">
              <p className="text-[#8A8A8E] text-sm">Nenhum post {filter !== "all" ? "desse formato " : ""}ainda. Toque em <b className="text-[#B9A2FF]">Novo post</b> pra gerar no estilo deste modelo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shown.map((p) => (
                <Link key={p.id} href={`/content/${p.id}`} className="group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.07] mb-2">
                    {p.cover && <img src={p.cover} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />}
                    <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-md lowercase ${typeBadge[p.type] ?? typeBadge.post}`}>{p.type}</span>
                  </div>
                  <p className="text-[13px] font-semibold truncate">{p.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: novo post com este modelo */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setGenOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[#161618] border border-white/[0.08] rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <img src={template.image_url} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
              <div>
                <h2 className="text-lg font-bold">Novo post com este modelo</h2>
                <p className="text-sm text-[#8A8A8E]">O post vai seguir o estilo dele.</p>
              </div>
            </div>

            <label className="text-xs font-semibold text-[#636366] tracking-widest">FORMATO</label>
            <div className="flex gap-2 mt-2 mb-4">
              {FORMATS.map((f) => (
                <button key={f.key} onClick={() => setFormat(f.key)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${format === f.key ? "bg-[#7B54FF] text-white border-transparent" : "bg-[#242426] text-[#8A8A8E] border-white/[0.1] hover:text-white"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <label className="text-xs font-semibold text-[#636366] tracking-widest">TEMA (opcional)</label>
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Ex: dica rápida sobre economia de tempo…"
              className="mt-2 w-full bg-[#242426] text-white text-sm rounded-xl px-4 py-3 leading-relaxed placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#7B54FF] resize-none"
            />

            <div className="flex gap-2 mt-5">
              <button onClick={() => setGenOpen(false)} className="flex-1 h-12 rounded-2xl bg-[#262628] text-sm font-semibold text-[#aaa]">Cancelar</button>
              <button onClick={fireGenerate} className="flex-1 h-12 rounded-2xl bg-[#7B54FF] text-sm font-semibold text-white active:scale-[0.98] transition-transform">Gerar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDel}
        title="Remover modelo?"
        message="Ele sai da sua biblioteca. Os posts já criados com ele continuam intactos."
        onConfirm={remove}
        onClose={() => setConfirmDel(false)}
      />
    </div>
  );
}
