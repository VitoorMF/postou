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
    // não permite desmarcar o último dia (precisa de ao menos 1 ativo)
    if (activeDays.includes(i) && activeDays.length === 1) return;

    const isAdding = !activeDays.includes(i);

    // adicionar estouraria o limite do plano
    if (isAdding && activeDays.length >= maxDays) {
      // limite de 1 dia → comporta como rádio: troca o dia em vez de bloquear
      if (maxDays === 1) {
        const next = [i];
        setLimitMsg("");
        setActiveDays(next);
        save({ active_days: next.map(String) });
        return;
      }
      const plural = `${maxDays} dias`;
      setLimitMsg(`Seu plano permite ${plural} por semana. Faça upgrade para liberar mais.`);
      setTimeout(() => setLimitMsg(""), 3000);
      return;
    }

    const next = activeDays.includes(i)
      ? activeDays.filter((d) => d !== i)
      : [...activeDays, i];
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

      <div className="w-full px-4 md:px-8 pt-4 md:pt-12 pb-4 shrink-0 max-w-[1100px] mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-[42px] font-extrabold tracking-[-0.035em] leading-none">Configurar</h1>
            <p className="text-base md:text-lg text-[#8A8A8E] font-medium mt-2">Escolha o que gerar todo dia</p>
          </div>
          {saving && (
            <span className="text-xs text-[#636366] mt-2 shrink-0">Salvando...</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 flex flex-col gap-7 pb-16 max-w-[1100px] mx-auto w-full">

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
                icon: <svg width="22" height="22" fill="currentColor" viewBox="0 0 512 512"><path d="M317.12 285.93c-9.69 3.96-15.88 19.13-22.16 26.88-3.22 3.97-7.06 4.59-12.01 2.6-36.37-14.49-64.25-38.76-84.32-72.23-3.4-5.19-2.79-9.29 1.31-14.11 6.06-7.14 13.68-15.25 15.32-24.87 3.64-21.28-24.18-87.29-60.92-57.38C48.62 232.97 330.7 461.46 381.61 337.88c14.4-35.03-48.43-58.53-64.49-51.95zM256 467.28c-37.39 0-74.18-9.94-106.39-28.76-5.17-3.03-11.42-3.83-17.2-2.26l-69.99 19.21 24.38-53.71a22.34 22.34 0 0 0-2.22-22.32C58.5 343.29 44.71 300.61 44.71 256c0-116.51 94.78-211.29 211.29-211.29S467.28 139.49 467.28 256c0 116.5-94.78 211.28-211.28 211.28zM256 0C114.84 0 0 114.84 0 256c0 49.66 14.1 97.35 40.89 138.74L2 480.39a22.37 22.37 0 0 0 3.34 23.76A22.403 22.403 0 0 0 22.36 512c14.42 0 93.05-24.71 113.06-30.2C172.41 501.59 213.9 512 256 512c141.15 0 256-114.85 256-256C512 114.84 397.15 0 256 0z" /></svg>,
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
