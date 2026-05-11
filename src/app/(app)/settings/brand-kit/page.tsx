"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getPaletteSync } from "colorthief";

const TONES = ["institucional", "próximo", "descontraído", "acadêmico", "inspirador"];

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

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 mx-auto">
        <button onClick={() => router.back()} className="h-9 w-9 rounded-full bg-[#1c1c1c] flex items-center justify-center mb-4">
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Brand kit</h1>
            <p className="text-base text-[#888079]">
              {loading ? "Carregando..." : (kit?.business_name ?? "Sua marca")}
            </p>
          </div>
          {saving && <span className="text-xs text-[#888079] mt-1">Salvando...</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 flex flex-col gap-4 pb-4 max-w-4xl mx-auto w-full">

        {loading ? (
          <>
            {/* Nome + Descrição */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="h-4 w-24 bg-[#2b2b2b] rounded-full" />
              <div className="h-10 w-full bg-[#2b2b2b] rounded-xl" />
              <div className="h-4 w-20 bg-[#2b2b2b] rounded-full" />
              <div className="h-20 w-full bg-[#2b2b2b] rounded-xl" />
            </div>
            {/* Logotipo */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-[#2b2b2b] shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-20 bg-[#2b2b2b] rounded-full" />
                <div className="h-3 w-24 bg-[#2b2b2b] rounded-full" />
              </div>
            </div>
            {/* Paleta */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="h-4 w-16 bg-[#2b2b2b] rounded-full" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 aspect-square rounded-xl bg-[#2b2b2b]" />
                ))}
              </div>
            </div>
            {/* Tom de voz */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="h-4 w-24 bg-[#2b2b2b] rounded-full" />
              <div className="flex gap-2 flex-wrap">
                {[80, 64, 96, 72, 88].map((w) => (
                  <div key={w} className="h-9 rounded-full bg-[#2b2b2b]" style={{ width: w }} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Nome da marca + Descrição */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">Nome da marca</p>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onBlur={() => save({ business_name: businessName })}
                  placeholder="Ex: Postou, Studio Alma..."
                  className="bg-[#242424] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">Sobre a marca</p>
                <textarea
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => save({ description })}
                  placeholder="O que sua marca faz? Para quem? Ex: Agência de moda voltada para jovens adultos no Sul do Brasil."
                  className="bg-[#242424] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none resize-none leading-snug"
                />
              </div>
            </div>

            {/* Logotipo */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#242424] flex items-center justify-center shrink-0 overflow-hidden">
                {kit?.logo_url ? (
                  <img src={kit.logo_url} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <svg width="24" height="24" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M8 17V7l4 8 4-8v10" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium">Logotipo</p>
                <p className="text-sm text-[#888079] truncate">
                  {kit?.logo_url ? "Logo salvo" : "Nenhum logo enviado"}
                </p>
              </div>
              <label className="text-sm text-[#137EFF] shrink-0 cursor-pointer">
                {kit?.logo_url ? "trocar" : "enviar"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>

            {/* Paleta */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium">Paleta</p>
                  <p className="text-sm text-[#888079]">
                    {palette.length > 0 ? `${palette.length} cores` : "Nenhuma cor ainda"}
                  </p>
                </div>
                {palette.length < 7 && (
                  <button
                    onClick={addColor}
                    className="h-8 w-8 rounded-full bg-[#2b2b2b] flex items-center justify-center shrink-0"
                  >
                    <svg width="14" height="14" fill="none" stroke="#888079" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                )}
              </div>

              {palette.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {palette.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1" style={{ width: "calc((100% - 4 * 8px) / 5)" }}>
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden group">
                        {/* swatch clicável abre color picker */}
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
                        {/* botão remover */}
                        <button
                          onClick={() => removeColor(i)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-[10px] text-[#888079]">{hex.replace("#", "").slice(0, 3).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={addColor}
                  className="w-full h-14 rounded-xl bg-[#242424] border border-dashed border-[#3a3a3a] text-sm text-[#555] flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" fill="none" stroke="#555" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Adicionar cor
                </button>
              )}
            </div>

            {/* Tom de voz */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-base font-medium">Tom de voz</p>
                <p className="text-sm text-[#888079]">Como sua marca se comunica</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => { setActiveTone(tone); save({ voice_tone: tone }); }}
                    disabled={saving}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${activeTone === tone ? "bg-[#137EFF] text-white" : "bg-[#2b2b2b] text-[#888079]"}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* O que não fazer */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-2">
              <div>
                <p className="text-base font-medium">O que não fazer</p>
                <p className="text-sm text-[#888079]">Restrições para a IA respeitar</p>
              </div>
              <textarea
                rows={3}
                value={doNotDo}
                onChange={(e) => setDoNotDo(e.target.value)}
                onBlur={() => save({ do_not_do: doNotDo })}
                placeholder="Ex: Não usar tom infantil. Não inventar promoções. Não mencionar concorrentes."
                className="bg-[#242424] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none resize-none leading-snug"
              />
            </div>

            {/* Personas */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium">Personas</p>
                  <p className="text-sm text-[#888079]">Rostos da marca — CEO, equipe, influencer</p>
                </div>
                <span className="text-xs text-[#555]">{personas.length}/6</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {personas.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#242424]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePersona(i)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {personas.length < 6 && (
                  <label className="aspect-square rounded-xl bg-[#242424] border border-dashed border-[#3a3a3a] flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="text-[10px] text-[#555]">foto</span>
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
          </>
        )}

        </div>
      </div>
    </div>
  );
}
