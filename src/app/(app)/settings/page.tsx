"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getLimits } from "@/lib/plans";

const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      role="switch"
      aria-checked={enabled}
      className={`w-[52px] h-[31px] rounded-full relative shrink-0 border transition-colors ${disabled ? "bg-[#1e1e21] border-white/[0.08] cursor-not-allowed" : enabled ? "bg-[#137EFF] border-transparent" : "bg-[#202022] border-white/[0.12]"}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-[23px] h-[23px] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform ${disabled ? "bg-[#555]" : "bg-white"} ${enabled ? "translate-x-[21px]" : "translate-x-0"}`} />
    </button>
  );
}

export default function Settings() {
  const [kitId, setKitId] = useState<string | null>(null);
  const [postTypes, setPostTypes] = useState<string[]>([]);
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitMsg, setLimitMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState("free");
  const [autoCount, setAutoCount] = useState(0);
  const [carrosselCount, setCarrosselCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data }, { data: userData }] = await Promise.all([
        supabase
          .from("brand_kits")
          .select("id, post_types, active_days, delivery_time")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("users")
          .select("plan, weekly_auto_count, weekly_carrossel_count")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      if (data) {
        setKitId(data.id);
        if (data.post_types?.length) setPostTypes(data.post_types);
        if (data.active_days?.length) setActiveDays(data.active_days.map(Number));
        if (data.delivery_time) setDeliveryTime(data.delivery_time);
      }
      if (userData) {
        setPlan(userData.plan ?? "free");
        setAutoCount(userData.weekly_auto_count ?? 0);
        setCarrosselCount(userData.weekly_carrossel_count ?? 0);
      }
      setLoaded(true);
    });
  }, []);

  const limits = getLimits(plan);
  const carrosselBlocked = carrosselCount >= limits.carrossel; // free → carrossel=0 → sempre true
  const autoExhausted = autoCount >= limits.auto;

  const PLAN_LABELS: Record<string, string> = {
    free: "Plano Free",
    starter: "Plano Starter",
    pro: "Plano Pro",
  };

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("brand_kits")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (data && !kitId) setKitId(data.id);
    setSaving(false);
  }

  function toggleType(type: string) {
    const next = [type];
    setPostTypes(next);
    save({ post_types: next });
  }

  // máximo de dias/semana por plano (deriva do limite de gerações automáticas)
  const maxDays = Math.min(limits.auto, 7);

  function toggleDay(i: number) {
    if (activeDays.includes(i) && activeDays.length === 1) return;
    const next = activeDays.includes(i)
      ? activeDays.filter((d) => d !== i)
      : [...activeDays, i];

    if (activeDays.includes(i) === false && next.length > maxDays) {
      const plural = maxDays === 1 ? "1 dia" : `${maxDays} dias`;
      setLimitMsg(`Seu plano permite ${plural} por semana. Faça upgrade para liberar mais.`);
      setTimeout(() => setLimitMsg(""), 3000);
      return;
    }
    setLimitMsg("");
    setActiveDays(next);
    save({ active_days: next.map(String) });
  }

  function pickTime(time: string) {
    setDeliveryTime(time);
    setShowTimePicker(false);
    save({ delivery_time: time });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">

      {/* Toast */}
      {limitMsg && (
        <div className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] text-white text-sm font-medium pl-3 pr-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in pointer-events-auto">
            <span className="h-7 w-7 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="#f5a524" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </span>
            <span>{limitMsg}</span>
          </div>
        </div>
      )}

      <div className="w-full px-4 md:px-10 pt-12 pb-4 shrink-0 max-w-[1020px] mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-[40px] font-extrabold tracking-[-0.035em] leading-none">Configurar</h1>
            <p className="text-base md:text-lg text-[#8A8A8E] font-medium mt-2">Escolha o que gerar todo dia</p>
          </div>
          {saving && (
            <span className="text-xs text-[#636366] mt-2 shrink-0">Salvando...</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-10 flex flex-col gap-7 pb-16 max-w-[1020px] mx-auto w-full">

          {/* atalhos */}
          <div className="flex flex-col gap-3">
            {[
              {
                href: "/settings/brand-kit", label: "Brand kit", sub: "Logotipo, paleta, tipografia e tom de voz",
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" /><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.55-.22-1.05-.59-1.41-.36-.36-.58-.86-.58-1.42a2 2 0 0 1 2-2H17a5 5 0 0 0 5-5c0-4.42-4.48-8-10-8z" /></svg>,
              },
              {
                href: "/settings/plans", label: "Planos", sub: PLAN_LABELS[plan] ?? "Plano Free",
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 7h18l-1.5 12.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5z" /><path d="M8 7V5a4 4 0 0 1 8 0v2" /></svg>,
              },
              {
                href: "/settings/whatsapp", label: "WhatsApp", sub: "Configurações do WhatsApp",
                icon: <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M.5 23.5l1.65-6a11.5 11.5 0 1 1 4.32 4.25L.5 23.5zM6.8 19.3l.37.22a9.55 9.55 0 1 0-3.23-3.16l.24.38-.98 3.57 3.6-1.01zM17.6 14.2c-.13-.22-.48-.35-1-.61s-3.06-1.51-3.54-1.68-.82-.26-1.16.26-1.33 1.68-1.63 2.02-.6.39-1.11.13a7.65 7.65 0 0 1-2.25-1.39 8.43 8.43 0 0 1-1.56-1.94c-.16-.28 0-.43.12-.58s.26-.3.39-.46a1.8 1.8 0 0 0 .26-.43.48.48 0 0 0 0-.46c-.07-.13-.58-1.4-.8-1.92s-.43-.43-.58-.44h-.5a.95.95 0 0 0-.69.32 2.9 2.9 0 0 0-.91 2.16 5.02 5.02 0 0 0 1.06 2.68c.13.17 1.82 2.78 4.42 3.9a14.9 14.9 0 0 0 1.48.55 3.55 3.55 0 0 0 1.63.1 2.67 2.67 0 0 0 1.75-1.23 2.16 2.16 0 0 0 .15-1.23z" /></svg>,
              },
            ].map(({ href, label, sub, icon }) => (
              <Link key={href} href={href} className="flex items-center gap-4 bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] p-4 md:px-6 md:py-5 hover:border-white/[0.12] hover:bg-[#1A1A1C] transition-colors">
                <span className="w-[42px] h-[42px] md:w-[46px] md:h-[46px] rounded-[12px] md:rounded-[13px] bg-[#202022] border border-white/[0.12] flex items-center justify-center text-[#8A8A8E] shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-lg font-bold tracking-[-0.01em]">{label}</p>
                  <p className="text-[13px] md:text-sm text-[#636366] font-medium mt-0.5 truncate">{sub}</p>
                </div>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-[#48484A] shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>

          {/* O que gerar */}
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3 ml-1">O que gerar</p>
            <div className="bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] overflow-hidden">
              {[
                { key: "carrossel", label: "Carrossel", sub: "Slides sobre o principal evento do dia" },
                { key: "post", label: "Post", sub: "1 imagem de destaque ou conquista" },
                { key: "story", label: "Story", sub: "1 imagem vertical para stories" },
                { key: "AI", label: "IA decide", sub: "A IA decide o tipo adequado (recomendado)" },
              ].map(({ key, label, sub }, idx) => {
                const isCarrossel = key === "carrossel";
                const disabled = isCarrossel && carrosselBlocked;
                const carrosselSub = plan === "free"
                  ? "Disponível nos planos pagos"
                  : "Limite semanal de carrossel atingido";
                return (
                  <div key={key} className={`flex items-center justify-between gap-4 p-4 md:px-6 md:py-5 ${idx > 0 ? "border-t border-white/[0.07]" : ""} ${key === "AI" ? "bg-gradient-to-r from-[#137EFF]/[0.06] to-transparent" : ""}`}>
                    <div className="min-w-0">
                      <p className={`text-base md:text-lg font-bold tracking-[-0.01em] ${disabled ? "text-[#666]" : ""}`}>{label}</p>
                      <p className="text-[12.5px] md:text-sm text-[#636366] font-medium mt-0.5">{disabled ? carrosselSub : sub}</p>
                    </div>
                    <Toggle
                      enabled={loaded && postTypes.includes(key)}
                      onChange={() => toggleType(key)}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
            {autoExhausted && (
              <p className="text-xs text-[#636366] px-1 mt-2.5">
                Você já usou suas {limits.auto} {limits.auto === 1 ? "geração automática" : "gerações automáticas"} desta semana. Renova segunda-feira.
              </p>
            )}
          </div>

          {/* Horário de entrega */}
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3 ml-1">Horário de entrega</p>
            <div className="bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] overflow-hidden">
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                className="w-full p-4 md:px-6 md:py-5 flex items-center justify-between gap-4"
              >
                <div className="text-left">
                  <p className="text-base md:text-lg font-bold tracking-[-0.01em]">Gerar todo dia às</p>
                  <p className="text-[12.5px] md:text-sm text-[#636366] font-medium mt-0.5">Você recebe uma notificação quando ficar pronto</p>
                </div>
                <span className="text-3xl md:text-[36px] font-extrabold tracking-[-0.03em] text-[#137EFF] shrink-0 tabular-nums">{deliveryTime}</span>
              </button>
              {showTimePicker && (
                <div className="border-t border-white/[0.07] flex overflow-x-auto scrollbar-none px-4 md:px-6 pb-4 pt-3 gap-2">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => pickTime(t)}
                      className={`shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors ${deliveryTime === t ? "bg-[#137EFF] text-white" : "bg-[#202022] border border-white/[0.12] text-[#8A8A8E]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dias da semana */}
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#636366] mb-3 ml-1">Dias da semana</p>
            <div className="bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] p-4 md:px-6 md:py-5">
              <p className="text-[13.5px] md:text-[15px] text-[#8A8A8E] font-medium mb-4">Gerar conteúdo somente nos dias selecionados</p>
              <div className="grid grid-cols-7 gap-2 md:gap-2.5">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`h-[46px] md:h-[54px] rounded-[11px] md:rounded-[13px] text-[15px] md:text-[17px] font-bold border transition-all ${activeDays.includes(i) ? "bg-[#137EFF] text-white border-transparent shadow-[0_8px_22px_-8px_rgba(19,126,255,0.6)]" : "bg-[#202022] border-white/[0.12] text-[#8A8A8E] hover:text-white"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full h-14 rounded-[15px] md:rounded-[16px] bg-[#161618] border border-white/[0.07] text-[#FF6B6B] text-[15px] md:text-base font-bold flex items-center justify-center gap-2.5 hover:bg-[#FF6B6B]/[0.08] hover:border-[#FF6B6B]/30 active:scale-[0.99] transition-all shrink-0"
          >
            <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair da conta
          </button>

        </div>
      </div>
    </div>
  );
}
