"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getPaletteSync } from "colorthief";
import { TONES } from "@/lib/tone";

// O time — cada agente hospeda o passo que consome o dado dele
const TEAM = [
  {
    img: "/agents/bibliotecario.png",
    name: "Bibliotecário",
    role: "BIBLIOTECÁRIO",
    accent: "#4f8dff",
    tile: "linear-gradient(160deg,#1a2438,#12151c)",
    tilt: "-6deg",
    short: "Guardo tudo sobre a marca",
    line: "Eu guardo tudo sobre a marca. Começa me contando o básico dela.",
  },
  {
    img: "/agents/roteirista.png",
    name: "Roteirista",
    role: "ROTEIRISTA",
    accent: "#f5a623",
    tile: "linear-gradient(160deg,#2e2413,#15130f)",
    tilt: "-2deg",
    short: "Escrevo os textos",
    line: "Sou eu que escrevo os textos. Como a sua marca fala com o cliente?",
  },
  {
    img: "/agents/artista.png",
    name: "Artista",
    role: "ARTISTA",
    accent: "#a06bff",
    tile: "linear-gradient(160deg,#241a38,#14121c)",
    tilt: "2deg",
    short: "Desenho cada post",
    line: "Eu desenho cada post. Me dá o logo e, se quiser, umas fotos suas.",
  },
  {
    img: "/agents/diretor.png",
    name: "Diretor",
    role: "DIRETOR",
    accent: "#ec4899",
    tile: "linear-gradient(160deg,#33162a,#160f16)",
    tilt: "6deg",
    short: "Decido o que postar",
    line: "Prontinho. Eu decido o que postar e o time já começa a trabalhar por você.",
  },
];

// step 0 = intro · 1 Bibliotecário · 2 Roteirista · 3 Artista · 4 Diretor (fim)
const SECTION = ["", "SUA MARCA", "TOM DE VOZ", "IDENTIDADE VISUAL", ""];
const LAST = 4;
const PRIMARY = "#2f6bff";
const CTAS = ["WhatsApp", "Loja física", "Site", "DM do Insta", "Delivery"];

const KEYFRAMES = `
@keyframes obFloat{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes obDot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-5px);opacity:1}}
@keyframes obPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes obPulse{0%,100%{box-shadow:0 0 0 3px var(--c)}50%{box-shadow:0 0 0 3px var(--c),0 0 22px 2px var(--c)}}
@keyframes obRise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes obBreathe{0%,100%{box-shadow:0 10px 30px -8px rgba(47,107,255,.5)}50%{box-shadow:0 10px 40px -4px rgba(47,107,255,.85)}}
`;

// enquadra o PNG 3D dentro de um tile/círculo sem cortar a cabeça
const portrait = "w-full h-full object-cover object-top scale-125 translate-y-1";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bibliotecário
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [mainProduct, setMainProduct] = useState("");
  // Roteirista
  const [tone, setTone] = useState("próximo");
  const [ctaChannel, setCtaChannel] = useState<string | null>(null);
  const [ctaOther, setCtaOther] = useState("");
  const [useEmoji, setUseEmoji] = useState(true);
  // Artista
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/");
    });
  }, [router]);

  function go(delta: number) {
    const next = Math.max(0, Math.min(LAST, step + delta));
    setStep(next);
    if (typingRef.current) clearTimeout(typingRef.current);
    if (delta > 0 && next >= 1 && next <= 3) {
      setIsTyping(true);
      typingRef.current = setTimeout(() => setIsTyping(false), 650);
    } else {
      setIsTyping(false);
    }
  }

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
      main_product: mainProduct.trim() || null,
      voice_tone: tone || "próximo",
      cta_channel: ctaChannel === "Outro" ? (ctaOther.trim() || null) : ctaChannel,
      use_emoji: useEmoji,
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
    router.push("/hoje");
  }

  const canAdvance = step !== 1 || (businessName.trim().length > 0 && description.trim().length > 0);
  const activeAgent = step === 0 ? -1 : Math.min(2, step - 1);
  const agent = step === LAST ? TEAM[3] : activeAgent >= 0 ? TEAM[activeAgent] : null;
  const skippable = step === 2 || step === 3;

  // estilo dos chips na cor do agente ativo
  const chip = (on: boolean) =>
    on
      ? { background: agent!.accent, color: "#fff", borderColor: agent!.accent, boxShadow: `0 6px 18px -6px ${agent!.accent}` }
      : { background: "#17161c", color: "#c7c6cf", borderColor: "rgba(255,255,255,0.07)", boxShadow: "none" };

  return (
    <div className="h-screen overflow-hidden bg-[#0e0d12] text-[#f4f3f7] font-sans flex flex-col md:flex-row">
      <style>{KEYFRAMES}</style>

      {/* Painel esquerdo — branding (só desktop) */}
      <div className="hidden md:flex md:w-[42%] lg:w-1/2 relative overflow-hidden border-r border-white/5 flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2f6bff]/20 via-[#2f6bff]/5 to-transparent pointer-events-none" />
        <span className="relative text-2xl font-extrabold tracking-tight">postou</span>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">Um time de IA<br />cuidando do seu<br />Instagram.</h2>
          <p className="text-[#a3a1ad] mt-5 max-w-sm leading-relaxed">
            Quatro profissionais — do acervo à arte final. Você só apresenta a marca; eles fazem o resto, todo dia.
          </p>
        </div>
        <span className="relative text-sm text-[#6f6e79]">Leva 2 minutos pra montar seu time.</span>
      </div>

      {/* Painel direito — fluxo */}
      <div className="flex-1 flex flex-col h-screen max-w-lg w-full mx-auto relative">

        {/* ===== INTRO ===== */}
        {step === 0 && (
          <div className="flex-1 overflow-y-auto px-6 pt-10 pb-36 scrollbar-none">
            <div className="flex justify-center items-end h-[150px]">
              {TEAM.map((t) => (
                <div
                  key={t.name}
                  className="w-[92px] h-[118px] rounded-[22px] -ml-4 overflow-hidden border"
                  style={{ background: t.tile, borderColor: `${t.accent}55`, transform: `rotate(${t.tilt})`, boxShadow: "0 16px 30px -12px #000" }}
                >
                  <img src={t.img} alt={t.name} className={portrait} />
                </div>
              ))}
            </div>

            <h1 className="mt-9 text-[34px] font-extrabold tracking-[-1px] leading-[1.05]">Oi 👋 esse é<br />o seu time.</h1>
            <p className="mt-4 text-base leading-relaxed text-[#a3a1ad] font-medium max-w-[300px]">
              Quatro agentes de IA cuidam do seu Instagram — do acervo da marca à arte final. Vem conhecer cada um.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              {TEAM.map((t) => (
                <div key={t.name} className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#17161c] border border-white/5">
                  <div className="h-11 w-11 rounded-[13px] overflow-hidden shrink-0" style={{ boxShadow: `inset 0 0 0 1.5px ${t.accent}66` }}>
                    <img src={t.img} alt={t.name} className={portrait} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold tracking-widest" style={{ color: t.accent }}>{t.role}</div>
                    <div className="text-sm text-[#c7c6cf] font-medium">{t.short}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== FORM STEPS ===== */}
        {agent && step !== LAST && (
          <>
            <div className="flex items-center gap-3.5 px-6 pt-6 pb-1">
              <button onClick={() => go(-1)} aria-label="Voltar" className="h-9 w-9 rounded-full bg-[#1c1b22] flex items-center justify-center shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="font-mono text-[11px] tracking-[2px] text-[#6f6e79]">{SECTION[step]}</span>
            </div>

            {/* roster que recruta o time */}
            <div className="flex items-center justify-between px-8 pt-3 pb-1.5">
              {TEAM.map((t, i) => {
                const done = i < activeAgent;
                const active = i === activeAgent;
                return (
                  <div key={t.name} className="flex items-center" style={{ flex: i < 3 ? "1" : "0 0 auto" }}>
                    <div
                      className="relative h-[46px] w-[46px] rounded-[14px] overflow-hidden shrink-0"
                      style={{
                        // @ts-expect-error css var
                        "--c": t.accent,
                        opacity: active ? 1 : done ? 0.95 : 0.4,
                        boxShadow: active ? `0 0 0 3px ${t.accent}` : done ? `0 0 0 2px ${t.accent}` : "0 0 0 1px rgba(255,255,255,0.08)",
                        animation: active ? "obPulse 2.4s ease-in-out infinite" : "none",
                      }}
                    >
                      <img src={t.img} alt={t.name} className={portrait} />
                      {done && (
                        <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full grid place-items-center border-2 border-[#0e0d12]" style={{ background: t.accent, animation: "obPop .3s ease" }}>
                          <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                      )}
                    </div>
                    {i < 3 && <div className="h-[3px] flex-1 rounded-full mx-1.5" style={{ background: i < activeAgent ? t.accent : "rgba(255,255,255,0.1)" }} />}
                  </div>
                );
              })}
            </div>

            {/* balão de chat do agente */}
            <div className="flex items-start gap-3 px-6 pt-3.5 pb-2">
              <div className="h-[54px] w-[54px] rounded-2xl overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 2px ${agent.accent}` }}>
                <img src={agent.img} alt={agent.name} className={portrait} />
              </div>
              <div className="bg-[#17161c] border border-white/[0.06] rounded-[6px_18px_18px_18px] px-4 py-3 min-h-[52px] flex items-center">
                {isTyping ? (
                  <div className="flex gap-1.5 px-1 py-0.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: agent.accent, animation: "obDot 1s infinite" }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: agent.accent, animation: "obDot 1s infinite .15s" }} />
                    <span className="h-2 w-2 rounded-full" style={{ background: agent.accent, animation: "obDot 1s infinite .3s" }} />
                  </div>
                ) : (
                  <div style={{ animation: "obFloat .35s ease" }}>
                    <span className="block text-[11px] font-extrabold tracking-widest mb-0.5" style={{ color: agent.accent }}>{agent.role}</span>
                    <span className="text-[14.5px] leading-snug text-[#e9e8ef] font-medium">{agent.line}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-1.5 pb-40 scrollbar-none">

              {/* STEP 1 — Bibliotecário */}
              {step === 1 && (
                <div className="flex flex-col gap-[18px]" style={{ animation: "obFloat .4s ease" }}>
                  <div>
                    <label className="block text-base font-bold mb-2.5">Nome da marca</label>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Doce Encanto"
                      autoFocus
                      className="w-full px-4 py-[15px] rounded-[14px] bg-[#17161c] border border-white/[0.07] text-[15px] text-white placeholder:text-[#6f6e79] outline-none focus:border-[#2f6bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold mb-2.5">Sobre a marca</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Conta em uma frase o que a marca faz e pra quem…"
                      className="w-full h-24 px-4 py-[15px] rounded-[14px] bg-[#17161c] border border-white/[0.07] text-[15px] text-white placeholder:text-[#6f6e79] outline-none focus:border-[#2f6bff] resize-none leading-snug"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold">Carro-chefe</label>
                    <div className="text-[13px] text-[#8a8993] mb-2.5">O que você mais vende — o time usa pra puxar os temas</div>
                    <input
                      value={mainProduct}
                      onChange={(e) => setMainProduct(e.target.value)}
                      placeholder="Ex: bolo de pote, corte masculino…"
                      className="w-full px-4 py-[15px] rounded-[14px] bg-[#17161c] border border-white/[0.07] text-[15px] text-white placeholder:text-[#6f6e79] outline-none focus:border-[#2f6bff]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 — Roteirista */}
              {step === 2 && (
                <div className="flex flex-col gap-[22px]" style={{ animation: "obFloat .4s ease" }}>
                  <div>
                    <div className="text-base font-bold">Tom de voz</div>
                    <div className="text-[13px] text-[#8a8993] mb-3">Como sua marca se comunica</div>
                    <div className="flex flex-wrap gap-2.5">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className="px-[17px] py-[11px] rounded-full text-sm font-semibold border transition-all"
                          style={chip(tone === t)}
                        >
                          {t[0].toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-base font-bold">Onde o cliente fecha</div>
                    <div className="text-[13px] text-[#8a8993] mb-3">Toda legenda termina chamando pra cá</div>
                    <div className="flex flex-wrap gap-2.5">
                      {[...CTAS, "Outro"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCtaChannel((prev) => (prev === c ? null : c))}
                          className="px-[17px] py-[11px] rounded-full text-sm font-semibold border transition-all"
                          style={chip(ctaChannel === c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {ctaChannel === "Outro" && (
                      <input
                        autoFocus
                        value={ctaOther}
                        onChange={(e) => setCtaOther(e.target.value)}
                        placeholder="Ex: agendar pelo app, ligar, ir na feira…"
                        className="mt-3 w-full px-4 py-[13px] rounded-[14px] bg-[#17161c] border border-white/[0.07] text-[15px] text-white placeholder:text-[#6f6e79] outline-none focus:border-[#2f6bff]"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#17161c] border border-white/5">
                    <div>
                      <div className="text-[15px] font-bold">Emoji nos textos</div>
                      <div className="text-[12.5px] text-[#8a8993]">Se a marca usa emoji nas legendas</div>
                    </div>
                    <div className="flex gap-1.5 bg-[#0e0d12] p-1 rounded-full shrink-0">
                      <button
                        onClick={() => setUseEmoji(true)}
                        className="px-3.5 py-2 rounded-full text-[13px] font-bold transition-colors"
                        style={useEmoji ? { background: PRIMARY, color: "#fff" } : { background: "transparent", color: "#8a8993" }}
                      >
                        Usa 😄
                      </button>
                      <button
                        onClick={() => setUseEmoji(false)}
                        className="px-3.5 py-2 rounded-full text-[13px] font-bold transition-colors"
                        style={!useEmoji ? { background: PRIMARY, color: "#fff" } : { background: "transparent", color: "#8a8993" }}
                      >
                        Sem
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Artista */}
              {step === 3 && (
                <div className="flex flex-col gap-4" style={{ animation: "obFloat .4s ease" }}>
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#17161c] border border-white/5">
                    <div className="h-[50px] w-[50px] rounded-xl bg-[#201f27] flex items-center justify-center shrink-0 overflow-hidden border border-dashed border-white/[0.14]">
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-mono text-[10px] text-[#6f6e79]">logo</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold">Logotipo</div>
                      <div className="text-[12.5px] text-[#8a8993]">{saving ? "Enviando..." : logoUrl ? "Logo salvo ✓" : "PNG ou SVG recomendado"}</div>
                    </div>
                    <label className="text-sm font-bold shrink-0 cursor-pointer" style={{ color: PRIMARY }}>
                      {logoUrl ? "trocar" : "enviar"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>

                  {palette.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#17161c] border border-white/5">
                      <div className="text-base font-bold">Paleta extraída</div>
                      <div className="text-[12.5px] text-[#8a8993] mb-3">Cores detectadas no logotipo</div>
                      <div className="flex gap-2">
                        {palette.map((hex, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full aspect-square rounded-xl" style={{ backgroundColor: hex }} />
                            <span className="text-[10px] text-[#8a8993]">{hex.replace("#", "").toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#17161c] border border-white/5">
                    <div className="text-base font-bold">Fotos suas</div>
                    <div className="text-[12.5px] text-[#8a8993] mb-3.5">Pra gerar posts com o seu rosto. Quanto mais fotos, melhor a semelhança.</div>
                    <div className="flex flex-wrap gap-2.5">
                      {personas.map((url, i) => (
                        <div key={i} className="relative h-[104px] w-[88px] rounded-[14px] overflow-hidden bg-[#201f27]">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removePersona(i)} className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center">
                            <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {personas.length < 6 && (
                        <label className="h-[104px] w-[88px] rounded-[14px] border-[1.5px] border-dashed border-white/[0.16] bg-[#131218] flex flex-col items-center justify-center gap-1.5 text-[#8a8993] cursor-pointer">
                          {saving ? (
                            <div className="h-5 w-5 rounded-full border-2 border-[#6f6e79] border-t-white animate-spin" />
                          ) : (
                            <>
                              <span className="text-2xl leading-none">＋</span>
                              <span className="text-[11px] font-mono">foto</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePersonaUpload} disabled={saving} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== FINAL ===== */}
        {step === LAST && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center text-center px-8 pt-6 pb-36 scrollbar-none">
            <div className="flex justify-center h-[70px] w-full mt-3">
              {TEAM.map((t, i) => (
                <div
                  key={t.name}
                  className="h-14 w-14 rounded-2xl -ml-2.5 overflow-hidden"
                  style={{ boxShadow: `0 0 0 2px ${t.accent}, 0 10px 20px -8px #000`, animation: `obRise .5s ease ${i * 0.08}s both` }}
                >
                  <img src={t.img} alt={t.name} className={portrait} />
                </div>
              ))}
            </div>

            <div className="mt-9 h-[140px] w-[140px] rounded-[34px] overflow-hidden" style={{ boxShadow: `0 0 0 2px ${TEAM[3].accent}, 0 0 60px -6px ${TEAM[3].accent}99`, animation: "obPop .5s ease" }}>
              <img src={TEAM[3].img} alt="Diretor" className={portrait} />
            </div>
            <div className="mt-[22px] text-xs font-extrabold tracking-[2px]" style={{ color: TEAM[3].accent }}>DIRETOR</div>
            <h1 className="mt-2 text-[32px] font-extrabold tracking-tight">Time montado 🎬</h1>
            <p className="mt-3.5 text-base leading-relaxed text-[#a3a1ad] font-medium max-w-[280px]">{TEAM[3].line}</p>
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div className="absolute left-0 right-0 bottom-0 px-6 pt-4 pb-7 z-10" style={{ background: "linear-gradient(to top,#0e0d12 62%,rgba(14,13,18,0))" }}>
          {err && <p className="text-sm text-red-400 text-center mb-3">{err}</p>}
          <button
            onClick={() => (step === LAST ? finish() : go(1))}
            disabled={saving || !canAdvance}
            className="w-full py-[17px] rounded-[17px] text-white text-[16.5px] font-extrabold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            style={{ background: PRIMARY, animation: saving || !canAdvance ? "none" : "obBreathe 3s ease-in-out infinite" }}
          >
            {saving ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <>
                {step === 0 ? "Conhecer meu time" : step === LAST ? "Começar" : "Continuar"}
                {step !== 1 && step !== 2 && step !== 3 && (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                )}
              </>
            )}
          </button>
          {skippable && (
            <div onClick={() => go(1)} className="text-center mt-3 text-sm text-[#6f6e79] font-semibold cursor-pointer">Pular</div>
          )}
        </div>
      </div>
    </div>
  );
}
