"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getPaletteSync } from "colorthief";

const TONES = ["institucional", "próximo", "descontraído", "acadêmico", "inspirador"];

const STEPS = [
  { label: "Sua marca" },
  { label: "Identidade" },
  { label: "Sua foto" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Step 0
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("");

  // Step 1
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);

  // Step 2
  const [personas, setPersonas] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/");
    });
  }, [router]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = objectUrl;
    await new Promise((res) => (img.onload = res));
    const raw = getPaletteSync(img, { colorCount: 5 });
    const hexPalette = raw?.map((c: { hex: () => string }) => c.hex()) ?? [];
    URL.revokeObjectURL(objectUrl);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const path = `${user.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("brand-kits").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("brand-kits").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      setPalette(hexPalette);
    }
    setSaving(false);
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
      setPersonas((prev) => [...prev, urlData.publicUrl]);
    }
    setSaving(false);
    e.target.value = "";
  }

  function removePersona(index: number) {
    setPersonas((prev) => prev.filter((_, i) => i !== index));
  }

  async function finish() {
    setSaving(true);
    setErr("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("brand_kits").upsert({
      user_id: user.id,
      business_name: businessName,
      description,
      voice_tone: tone || "próximo",
      logo_url: logoUrl,
      palette_hex: palette,
      persona_urls: personas,
      post_types: ["AI"],
      active_days: ["2"],
      delivery_time: "08:00",
    }, { onConflict: "user_id" });

    if (error) {
      console.error("Erro ao salvar brand kit:", error);
      setErr(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/feed");
  }

  const canAdvance0 = businessName.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans">
     <div className="flex flex-col min-h-screen max-w-lg mx-auto px-4 md:justify-center">

      {/* Progress */}
      <div className="pt-12 pb-6 shrink-0">
        {/* Voltar — seta no topo, só a partir do passo 2 */}
        <button
          onClick={() => setStep((s) => s - 1)}
          className={`h-9 w-9 rounded-full bg-[#1c1c1c] flex items-center justify-center mb-4 transition-opacity ${
            step > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Voltar"
        >
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#137EFF]" : "bg-[#2b2b2b]"}`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] font-medium tracking-widest uppercase">
          Passo {step + 1} de {STEPS.length}
        </p>
        <h1 className="text-3xl font-semibold mt-1">{STEPS[step].label}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4 pb-6">

        {/* Step 0 — Sua marca */}
        {step === 0 && (
          <>
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">Nome da marca</p>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Studio Alma, Naná Normanha..."
                  className="bg-[#242424] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">Sobre a marca</p>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="O que sua marca faz? Para quem? Ex: Engenheira agrônoma e especialista em comunicação estratégica para o agronegócio."
                  className="bg-[#242424] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none resize-none leading-snug"
                />
              </div>
            </div>

            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-base font-medium">Tom de voz</p>
                <p className="text-sm text-[#888079]">Como sua marca se comunica</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tone === t ? "bg-[#137EFF] text-white" : "bg-[#2b2b2b] text-[#888079]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 1 — Identidade visual */}
        {step === 1 && (
          <>
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-[#242424] flex items-center justify-center shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <svg width="24" height="24" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M8 17V7l4 8 4-8v10" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium">Logotipo</p>
                <p className="text-sm text-[#888079]">
                  {saving ? "Enviando..." : logoUrl ? "Logo salvo ✓" : "PNG ou SVG recomendado"}
                </p>
              </div>
              <label className="text-sm text-[#137EFF] shrink-0 cursor-pointer">
                {logoUrl ? "trocar" : "enviar"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>

            {palette.length > 0 && (
              <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <p className="text-base font-medium">Paleta extraída</p>
                  <p className="text-sm text-[#888079]">Cores detectadas no logotipo</p>
                </div>
                <div className="flex gap-2">
                  {palette.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full aspect-square rounded-xl" style={{ backgroundColor: hex }} />
                      <span className="text-[10px] text-[#888079]">{hex.replace("#", "").toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-[#555] text-center">Pode pular — você edita isso depois nas configurações</p>
          </>
        )}

        {/* Step 2 — Sua foto */}
        {step === 2 && (
          <>
            <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-base font-medium">Fotos suas</p>
                <p className="text-sm text-[#888079]">Usamos para gerar posts com o seu rosto. Quanto mais fotos, melhor a semelhança.</p>
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
                    {saving ? (
                      <div className="h-5 w-5 rounded-full border-2 border-[#555] border-t-white animate-spin" />
                    ) : (
                      <>
                        <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span className="text-[10px] text-[#555]">foto</span>
                      </>
                    )}
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

            <p className="text-sm text-[#555] text-center">Opcional — você adiciona fotos depois também</p>
          </>
        )}
      </div>

      {/* Footer buttons */}
      <div className="pb-10 shrink-0 flex flex-col gap-3">
        {err && <p className="text-sm text-red-400 text-center">{err}</p>}
        {step < STEPS.length - 1 ? (
          <>
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !canAdvance0}
              className="w-full h-14 rounded-2xl bg-[#137EFF] text-white text-base font-semibold disabled:opacity-40 transition-opacity"
            >
              Continuar
            </button>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="w-full h-10 text-sm text-[#555]"
              >
                Pular
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={finish}
              disabled={saving}
              className="w-full h-14 rounded-2xl bg-[#137EFF] text-white text-base font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  Começar
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={finish}
              disabled={saving}
              className="w-full h-10 text-sm text-[#555]"
            >
              Pular e começar
            </button>
          </>
        )}

      </div>
     </div>
    </div>
  );
}
