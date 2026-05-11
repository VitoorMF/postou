"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-[#137EFF]" : "bg-[#3a3a3a]"}`}
    >
      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-[-2px]" : "translate-x-[-22px]"}`} />
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
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("brand_kits")
        .select("id, post_types, active_days, delivery_time")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setKitId(data.id);
        if (data.post_types?.length) setPostTypes(data.post_types);
        if (data.active_days?.length) setActiveDays(data.active_days.map(Number));
        if (data.delivery_time) setDeliveryTime(data.delivery_time);
      }
      setLoaded(true);
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

  function toggleDay(i: number) {
    if (activeDays.includes(i) && activeDays.length === 1) return;
    const next = activeDays.includes(i)
      ? activeDays.filter((d) => d !== i)
      : [...activeDays, i];
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
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans">

      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Configurar</h1>
            <p className="text-base text-[#888079]">Escolha o que gerar todo dia</p>
          </div>
          {saving && (
            <span className="text-xs text-[#888079] mt-1.5">Salvando...</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 flex flex-col gap-6 pb-4 max-w-4xl mx-auto w-full">

        <div className="flex flex-col gap-2">
          {[
            { href: "/settings/brand-kit", label: "Brand kit", sub: "Logotipo, paleta, tipografia e tom de voz" },
            { href: "/settings/plans", label: "Planos", sub: "Trial · 6 dias restantes" },
          ].map(({ href, label, sub }) => (
            <Link key={href} href={href} className="bg-[#1c1c1c] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-base font-medium">{label}</p>
                <p className="text-sm text-[#888079]">{sub}</p>
              </div>
              <svg width="16" height="16" fill="none" stroke="#888079" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#555] tracking-widest">O QUE GERAR</p>
          <div className="bg-[#1c1c1c] rounded-2xl divide-y divide-[#2a2a2a]">
            {[
              { key: "carrossel", label: "Carrossel", sub: "9 slides sobre o principal evento do dia" },
              { key: "post", label: "Post", sub: "1 imagem de destaque ou conquista" },
              { key: "story", label: "Story", sub: "1 imagem vertical para stories" },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between p-4 gap-4">
                <div>
                  <p className="text-base font-medium">{label}</p>
                  <p className="text-sm text-[#888079]">{sub}</p>
                </div>
                <Toggle
                  enabled={loaded && postTypes.includes(key)}
                  onChange={() => toggleType(key)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#555] tracking-widest">HORÁRIO DE ENTREGA</p>
          <div className="bg-[#1c1c1c] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="text-left">
                <p className="text-base font-medium">Gerar todo dia às</p>
                <p className="text-sm text-[#888079]">Você recebe uma notificação quando ficar pronto</p>
              </div>
              <span className="text-2xl font-semibold text-[#137EFF] shrink-0">{deliveryTime}</span>
            </button>
            {showTimePicker && (
              <div className="border-t border-[#2a2a2a] flex overflow-x-auto scrollbar-none px-4 pb-4 pt-3 gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => pickTime(t)}
                    className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors ${deliveryTime === t ? "bg-[#137EFF] text-white" : "bg-[#2b2b2b] text-[#888079]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#555] tracking-widest">DIAS DA SEMANA</p>
          <div className="bg-[#1c1c1c] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm text-[#888079]">Gerar conteúdo somente nos dias selecionados</p>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${activeDays.includes(i) ? "bg-[#137EFF] text-white" : "bg-[#2b2b2b] text-[#888079]"}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl bg-[#1c1c1c] text-[#888079] text-sm font-medium flex items-center justify-center gap-2 hover:text-red-400 transition-colors shrink-0"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sair da conta
        </button>

        </div>
      </div>
    </div>
  );
}
