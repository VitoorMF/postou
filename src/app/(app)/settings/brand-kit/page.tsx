"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getPaletteSync } from "colorthief";
import { TONES } from "@/lib/tone";

interface BrandKit {
  id: string;
  business_name: string | null;
  description: string | null;
  do_not_do: string | null;
  voice_tone: string | null;
  palette_hex: string[] | null;
  logo_url: string | null;
  persona_urls: string[] | null;
}

export default function BrandKitPage() {
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [doNotDo, setDoNotDo] = useState("");
  const [palette, setPalette] = useState<string[]>([]);
  const [activeTone, setActiveTone] = useState("");
  const [personas, setPersonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colorInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("brand_kits")
        .select("id, business_name, description, do_not_do, voice_tone, palette_hex, logo_url, persona_urls")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setKit(data);
        setBusinessName(data.business_name ?? "");
        setDescription(data.description ?? "");
        setDoNotDo(data.do_not_do ?? "");
        setPalette(data.palette_hex ?? []);
        setPersonas(data.persona_urls ?? []);
        if (data.voice_tone) setActiveTone(data.voice_tone);
      }
      setLoading(false);
    });
  }, []);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("brand_kits")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" })
      .select("id, business_name, description, do_not_do, voice_tone, palette_hex, logo_url, persona_urls")
      .single();
    if (data) {
      setKit(data);
      setPersonas(data.persona_urls ?? []);
    }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);

    // extrai paleta do logo antes do upload
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = objectUrl;
    await new Promise((res) => (img.onload = res));
    const raw = getPaletteSync(img, { colorCount: 5 });
    const hexPalette = raw?.map((c) => c.hex()) ?? [];
    URL.revokeObjectURL(objectUrl);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const path = `${user.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("brand-kits").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("brand-kits").getPublicUrl(path);
      setPalette(hexPalette);
      await save({ logo_url: urlData.publicUrl, palette_hex: hexPalette });
    }
    setSaving(false);
  }

  function updateColor(index: number, hex: string) {
    const next = palette.map((c, i) => (i === index ? hex : c));
    setPalette(next);
    save({ palette_hex: next });
  }

  function removeColor(index: number) {
    const next = palette.filter((_, i) => i !== index);
    setPalette(next);
    save({ palette_hex: next });
  }

  function addColor() {
    const next = [...palette, "#FFFFFF"];
    setPalette(next);
    save({ palette_hex: next });
    // abre o color picker da nova cor
    setTimeout(() => {
      colorInputRefs.current[next.length - 1]?.click();
    }, 50);
  }

  async function handlePersonaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || personas.length >= 6) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const path = `${user.id}/personas/persona-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("brand-kits").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("brand-kits").getPublicUrl(path);
      const next = [...personas, urlData.publicUrl];
      setPersonas(next);
      await save({ persona_urls: next });
    }
    setSaving(false);
    // limpa o input pra permitir re-upload do mesmo arquivo
    e.target.value = "";
  }

  async function removePersona(index: number) {
    const next = personas.filter((_, i) => i !== index);
    setPersonas(next);
    await save({ persona_urls: next });
  }

  const cardCls = "bg-[#1A1A1C] border border-white/[0.07] rounded-[22px] p-6";
  const fieldCls = "w-full bg-[#242426] border border-white/[0.12] rounded-[14px] px-4 py-3.5 text-[15px] md:text-base text-white placeholder:text-[#555] focus:outline-none focus:border-[#137EFF]/60 transition-colors";
  const labelCls = "text-lg font-bold tracking-[-0.02em] mb-4";

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">

      <div className="w-full px-4 md:px-12 pt-12 pb-2 shrink-0 max-w-[1360px] mx-auto">
        <button onClick={() => router.back()} aria-label="Voltar" className="h-11 w-11 rounded-[14px] bg-[#1A1A1C] border border-white/[0.07] flex items-center justify-center text-white hover:bg-[#262628] active:scale-95 transition-all mb-6">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-[42px] font-extrabold tracking-[-0.035em] leading-none">Brand kit</h1>
            <p className="text-[#8A8A8E] text-base md:text-lg font-medium mt-2">
              {loading ? "Carregando..." : (kit?.business_name ?? "Sua marca")}
            </p>
          </div>
          {saving && <span className="text-xs text-[#636366] mb-1.5 shrink-0">Salvando...</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-12 pt-6 pb-16 max-w-[1360px] mx-auto w-full">

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2].map((c) => (
              <div key={c} className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`${cardCls} animate-pulse`}>
                    <div className="h-5 w-32 bg-[#2b2b2b] rounded-full mb-4" />
                    <div className="h-12 w-full bg-[#242426] rounded-xl" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 items-start">

            {/* ===== COLUNA TEXTUAL ===== */}
            <div className="flex flex-col gap-4">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366] flex items-center gap-2.5 mb-1 ml-1">
                <svg width="15" height="15" fill="none" stroke="#48484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>
                Identidade verbal
              </p>

              {/* Nome */}
              <div className={cardCls}>
                <p className={labelCls}>Nome da marca</p>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onBlur={() => save({ business_name: businessName })}
                  placeholder="Ex: Postou, Studio Alma..."
                  maxLength={100}
                  className={fieldCls}
                />
              </div>

              {/* Sobre */}
              <div className={cardCls}>
                <p className={labelCls}>Sobre a marca</p>
                <textarea
                  rows={9}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => save({ description })}
                  placeholder="O que sua marca faz? Para quem? Ex: Agência de moda voltada para jovens adultos no Sul do Brasil."
                  maxLength={5000}
                  className={`${fieldCls} resize-none leading-relaxed`}
                />
              </div>

              {/* Tom de voz */}
              <div className={cardCls}>
                <p className="text-lg font-bold tracking-[-0.02em]">Tom de voz</p>
                <p className="text-[#636366] text-sm font-medium mt-1">Como sua marca se comunica</p>
                <div className="flex gap-3 flex-wrap mt-5">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => { setActiveTone(tone); save({ voice_tone: tone }); }}
                      disabled={saving}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all disabled:opacity-50 ${activeTone === tone ? "bg-[#137EFF] text-white border-transparent shadow-[0_8px_22px_-8px_rgba(19,126,255,0.6)]" : "bg-[#242426] text-[#8A8A8E] border-white/[0.12] hover:text-white"}`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* O que não fazer */}
              <div className={cardCls}>
                <p className="text-lg font-bold tracking-[-0.02em]">O que não fazer</p>
                <p className="text-[#636366] text-sm font-medium mt-1 mb-4">Restrições para a IA respeitar</p>
                <textarea
                  rows={3}
                  value={doNotDo}
                  onChange={(e) => setDoNotDo(e.target.value)}
                  onBlur={() => save({ do_not_do: doNotDo })}
                  placeholder="Ex: Não usar tom infantil. Não inventar promoções. Não mencionar concorrentes."
                  maxLength={2000}
                  className={`${fieldCls} resize-none leading-relaxed`}
                />
              </div>
            </div>

            {/* ===== COLUNA VISUAL ===== */}
            <div className="flex flex-col gap-4">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-[#636366] flex items-center gap-2.5 mb-1 ml-1">
                <svg width="15" height="15" fill="none" stroke="#48484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
                Identidade visual
              </p>

              {/* Logotipo */}
              <div className={cardCls}>
                <div className="flex items-center gap-4">
                  <div className="h-[72px] w-[72px] rounded-2xl bg-[#0e0e10] border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden">
                    {kit?.logo_url ? (
                      <img src={kit.logo_url} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <svg width="28" height="28" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <path d="M8 17V7l4 8 4-8v10" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold tracking-[-0.02em]">Logotipo</p>
                    <p className="text-sm text-[#636366] font-medium truncate mt-0.5">
                      {kit?.logo_url ? "Logo salvo" : "Nenhum logo enviado"}
                    </p>
                  </div>
                  <label className="text-base text-[#137EFF] font-semibold shrink-0 cursor-pointer hover:text-[#4a9eff] transition-colors">
                    {kit?.logo_url ? "trocar" : "enviar"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              {/* Paleta */}
              <div className={cardCls}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold tracking-[-0.02em]">Paleta</p>
                    <p className="text-sm text-[#636366] font-medium mt-1">
                      {palette.length > 0 ? `${palette.length} cores` : "Nenhuma cor ainda"}
                    </p>
                  </div>
                  {palette.length < 7 && (
                    <button
                      onClick={addColor}
                      aria-label="Adicionar cor"
                      className="h-10 w-10 rounded-xl bg-[#242426] border border-white/[0.12] flex items-center justify-center shrink-0 hover:bg-[#262628] active:scale-95 transition-all"
                    >
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  )}
                </div>

                {palette.length > 0 ? (
                  <div className="grid grid-cols-5 gap-3.5 mt-5">
                    {palette.map((hex, i) => (
                      <div key={i} className="relative">
                        <div className="relative w-full aspect-[1/1.04] rounded-2xl overflow-hidden border border-white/[0.08] group">
                          <div
                            className="w-full h-full cursor-pointer"
                            style={{ backgroundColor: hex }}
                            onClick={() => colorInputRefs.current[i]?.click()}
                          />
                          <input
                            type="color"
                            value={hex}
                            ref={(el) => { colorInputRefs.current[i] = el; }}
                            onChange={(e) => updateColor(i, e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <button
                            onClick={() => removeColor(i)}
                            aria-label="Remover"
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                          >
                            <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <span className="block text-center text-[13px] text-[#636366] font-semibold mt-2.5 tabular-nums tracking-wide">{hex.replace("#", "").slice(0, 3).toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={addColor}
                    className="w-full h-16 rounded-2xl bg-[#242426] border border-dashed border-white/[0.12] text-sm text-[#636366] flex items-center justify-center gap-2 mt-5 hover:text-white transition-colors"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar cor
                  </button>
                )}
              </div>

              {/* Personas */}
              <div className={cardCls}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold tracking-[-0.02em]">Personas</p>
                    <p className="text-sm text-[#636366] font-medium mt-1">Rostos da marca — CEO, equipe, influencer</p>
                  </div>
                  <span className="text-sm text-[#636366] font-semibold tabular-nums shrink-0">{personas.length}/6</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  {personas.map((url, i) => (
                    <div key={i} className="relative aspect-[1/1.12] rounded-2xl overflow-hidden border border-white/[0.07] bg-[#242426]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePersona(i)}
                        aria-label="Remover"
                        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-red-500/80 active:scale-90 transition-all"
                      >
                        <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {personas.length < 6 && (
                    <label className="aspect-[1/1.12] rounded-2xl bg-white/[0.02] border-[1.5px] border-dashed border-white/[0.12] flex flex-col items-center justify-center gap-3 cursor-pointer text-[#636366] hover:border-[#137EFF]/50 hover:text-white hover:bg-[#137EFF]/5 transition-all">
                      <span className="h-10 w-10 rounded-full border-[1.5px] border-current flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold">foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePersonaUpload}
                        disabled={saving}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
}
