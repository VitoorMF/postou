import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import GenerateButton from "@/components/GenerateButton";
import BrandKitAvatar from "@/components/BrandKitAvatar";
import { getLimits } from "@/lib/plans";

interface Slide { id: string; order: number; image_url: string | null; }
interface Pack {
  id: string;
  type: "carrossel" | "post" | "story";
  title: string;
  status: string;
  created_at: string;
  slides: Slide[];
}

const typeDot: Record<string, string> = { carrossel: "#2F6BFF", post: "#F0871E", story: "#30C46B" };

function spNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}
function fmt(opts: Intl.DateTimeFormatOptions) {
  return new Date().toLocaleDateString("pt-BR", { ...opts, timeZone: "America/Sao_Paulo" });
}

export default async function HojePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: userRow }, { data: kit }, { data: packs }] = await Promise.all([
    supabase.from("users").select("plan, weekly_auto_count, weekly_manual_count, weekly_carrossel_count").eq("id", user!.id).maybeSingle(),
    supabase.from("brand_kits").select("business_name, delivery_time, active_days").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("packs")
      .select("id, type, title, status, created_at, slides(id, order, image_url)")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const plan = userRow?.plan ?? "free";
  const limits = getLimits(plan);
  const brandName = kit?.business_name ?? "";
  const deliveryTime = kit?.delivery_time ?? null;

  //lista de dias ativos, retornada pelo backend como array de strings (ex: ["0", "5", "2"]) ou null se não configurado. Convertemos para números e ordenamos.
  const activeDays = kit?.active_days?.map(Number).sort((a: number, b: number) => a - b) ?? [];

  // getDay(): 0=domingo. Os active_days usam 0=segunda (igual ao cron). Converte.
  const todayWeekday = (spNow().getDay() + 6) % 7;
  const isTodayActive = activeDays.length === 0 || activeDays.includes(todayWeekday);

  const allPacks = (packs ?? []) as Pack[];
  const successPacks = allPacks.filter((p) => p.status === "success");
  const hasPending = allPacks.some((p) => p.status === "pending");
  const count = successPacks.length;
  const cards = successPacks.map((p) => ({
    id: p.id, type: p.type, title: p.title,
    cover: p.slides?.find((s) => s.order === 1)?.image_url ?? p.slides?.[0]?.image_url ?? null,
  }));

  const meters = [
    {
      key: "auto", label: "Automáticas", used: userRow?.weekly_auto_count ?? 0, limit: limits.auto, accent: "#F0871E",
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4" /><polyline points="21 3 21 8 16 8" /></svg>
    },
    {
      key: "manual", label: "Manuais", used: userRow?.weekly_manual_count ?? 0, limit: limits.manual, accent: "#2F6BFF",
      icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" /></svg>
    },
    {
      key: "carrossel", label: "Carrossel", used: userRow?.weekly_carrossel_count ?? 0, limit: limits.carrossel, accent: "#2F6BFF",
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2" /><path d="M4 7v10M20 7v10" /></svg>
    },
  ].map((m) => {
    const unlimited = m.limit === Infinity;
    const locked = m.limit === 0;
    const exhausted = !unlimited && !locked && m.used >= m.limit;
    return { ...m, unlimited, locked, exhausted };
  });

  // saudação / data / agendado
  const hour = spNow().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const weekdayShort = fmt({ weekday: "short" }).replace(".", "").toUpperCase();
  const weekdayLong = fmt({ weekday: "long" }).toUpperCase();
  const dayNum = fmt({ day: "2-digit" });
  const monthShort = fmt({ month: "short" }).replace(".", "").toUpperCase();
  const monthLong = fmt({ month: "long" });

  const deliveryHour = deliveryTime ? parseInt(deliveryTime.split(":")[0], 10) : null;
  // hoje ainda vai gerar (dia ativo + ainda não gerou)
  const comingToday = !!deliveryTime && isTodayActive && count === 0;
  // mostra o pill "Chega às" só se o horário ainda não passou
  const pillUpcoming = comingToday && deliveryHour !== null && deliveryHour > hour;

  // Calcula o rótulo do PRÓXIMO post automático (varre os dias ativos de verdade).
  // 0=segunda … 6=domingo.
  const WEEKDAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  function nextAutoLabel(): string {
    if (!deliveryTime) return "";
    const days = activeDays.length ? activeDays : [0, 1, 2, 3, 4, 5, 6];
    if (days.includes(todayWeekday) && count === 0) return "hoje";
    for (let off = 1; off <= 7; off++) {
      const d = (todayWeekday + off) % 7;
      if (days.includes(d)) return off === 1 ? "amanhã" : WEEKDAYS[d];
    }
    return "";
  }
  const nextWhen = nextAutoLabel();

  const subtitle = count >= 3
    ? "Você arrasou hoje 🔥"
    : count > 0
      ? "Seu conteúdo do dia está pronto."
      : pillUpcoming
        ? `Seu primeiro post chega às ${deliveryTime}.`
        : "";

  // ─── Sub-render: estado do "Seu dia" ──────────────────────────────────
  function SeuDiaCards() {
    if (count > 0) {
      return (
        <div className="flex gap-3.5 overflow-x-auto scrollbar-none">
          {cards.map((c) => (
            <Link key={c.id} href={`/content/${c.id}`} className="shrink-0 w-[180px]">
              <div className="relative w-[180px] aspect-square rounded-[16px] overflow-hidden bg-[#242424] mb-2.5">
                {c.cover && <img src={c.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <span className="absolute bottom-2.5 right-2.5 h-7 w-7 rounded-full grid place-items-center" style={{ background: typeDot[c.type] ?? "#2F6BFF" }}>
                  <span className="h-2.5 w-3.5 rounded-[3px] bg-white/90" />
                </span>
              </div>
              <p className="text-[14px] font-bold truncate">{c.title}</p>
            </Link>
          ))}
          <div className="shrink-0 w-[180px]">
            <GenerateButton variant="tile" />
          </div>
        </div>
      );
    }
    if (hasPending) {
      return (
        <div className="flex items-center gap-4 py-2">
          <div className="h-10 w-10 rounded-full border-[3px] border-white/[0.12] border-t-[#3b76ff] animate-spin shrink-0" />
          <div>
            <p className="text-[17px] font-bold">Gerando seu conteúdo…</p>
            <p className="text-[#8A8A8E] text-sm mt-0.5">Fica pronto em alguns minutos</p>
          </div>
        </div>
      );
    }
    // agendado / vazio — varia conforme hoje é dia ativo
    const title = !deliveryTime
      ? "Nenhum post hoje ainda"
      : comingToday
        ? "Seu post de hoje está a caminho"
        : isTodayActive
          ? "Seu post de hoje está a caminho"
          : "Hoje não é dia de post automático";
    const desc = !deliveryTime
      ? "Crie um agora ou aguarde o automático."
      : isTodayActive
        ? "A IA está preparando o conteúdo perfeito pra sua marca."
        : "Você configurou outros dias da semana. Crie um post manual quando quiser.";

    return (
      <div className="flex items-center gap-4 py-2">
        <div className="h-[72px] w-[72px] rounded-[20px] grid place-items-center shrink-0 border border-[#2F6BFF]/30" style={{ background: "linear-gradient(160deg,#1f2b52,#141a36)" }}>
          <svg width="34" height="34" fill="none" stroke="#7da2ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
        </div>
        <div>
          <p className="text-[20px] font-extrabold">{title}</p>
          <p className="text-[#8A8A8E] text-[15px] mt-1">{desc}</p>
          {pillUpcoming && (
            <div className="inline-flex items-center gap-2 mt-3 bg-[#2F6BFF]/12 border border-[#2F6BFF]/30 text-[#9bbaff] text-sm font-bold px-3.5 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#2F6BFF]" /> Chega às {deliveryTime}
            </div>
          )}
        </div>
      </div>
    );
  }

  function QuotaCard({ m, big }: { m: typeof meters[number]; big?: boolean }) {
    const numColor = m.locked ? "#636366" : m.exhausted || m.used === 0 ? m.accent : "#fff";
    return (
      <div className={`bg-[#1A1A1C] border border-white/[0.07] rounded-[18px] ${big ? "p-5" : "p-3.5"} flex flex-col gap-3`}>
        <span className={`${big ? "h-10 w-10" : "h-8 w-8"} rounded-[11px] grid place-items-center`} style={{ background: `${m.accent}1f`, color: m.accent }}>{m.icon}</span>
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className={`${big ? "text-[32px]" : "text-[26px]"} font-extrabold leading-none`} style={{ color: numColor }}>
              {m.unlimited ? "∞" : m.locked ? "—" : m.used}
            </span>
            {!m.unlimited && !m.locked && <span className="text-[#636366] text-[15px] font-semibold">/{m.limit}</span>}
          </div>
          <p className="text-[#8A8A8E] text-[13px] font-medium mt-1.5">{m.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-5 lg:px-10 pt-12 pb-8 lg:pb-12 max-w-lg lg:max-w-[1100px] mx-auto w-full">

          {/* ===== Header ===== */}
          <div className="flex items-start justify-between gap-4 mb-7">
            <div>
              <p className="lg:hidden text-[#636366] text-[12.5px] font-bold tracking-[0.14em] mb-1">{weekdayShort} · {dayNum} {monthShort}</p>
              <h1 className="text-[40px] lg:text-[44px] font-extrabold tracking-tight leading-none">Hoje</h1>
              <p className="text-[#8A8A8E] text-base lg:text-lg mt-2 font-medium">
                {greeting}{brandName ? <>, <b className="text-white font-semibold">{brandName}</b></> : ""} 👋
                {subtitle && <span className="hidden lg:inline"> {subtitle}</span>}
              </p>
            </div>
            <div className="shrink-0">
              <div className="lg:hidden"><BrandKitAvatar /></div>
              <div className="hidden lg:block text-right">
                <p className="text-[#636366] text-[12.5px] font-bold tracking-[0.14em]">{weekdayLong}</p>
                <p className="text-[22px] font-extrabold leading-tight">{dayNum} de {monthLong}</p>
              </div>
            </div>
          </div>

          {/* ===== MOBILE ===== */}
          <div className="lg:hidden flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <p className="text-[15px] font-bold">Seu dia</p>
              <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-5">
                {count > 0 ? (
                  <Link href="/content" className="flex items-center gap-4">
                    <span className="text-[44px] font-extrabold leading-none shrink-0">{count}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-bold leading-tight">{count === 1 ? "post gerado hoje" : "posts gerados hoje"}</p>
                      <p className="text-[#8A8A8E] text-sm mt-0.5">Toque para ver no Conteúdo</p>
                    </div>
                    <div className="relative w-16 h-16 shrink-0">
                      {cards.slice(0, 3).map((c, i) => c.cover && (
                        <img key={i} src={c.cover} alt="" className="absolute w-14 h-14 rounded-xl object-cover border border-white/10"
                          style={{ right: `${i * 7}px`, top: `${i * 4}px`, transform: `rotate(${(i - 1) * 5}deg)`, zIndex: 3 - i }} />
                      ))}
                    </div>
                  </Link>
                ) : (
                  <SeuDiaCards />
                )}
              </div>
            </div>

            <GenerateButton variant="card" />

            <div className="flex flex-col gap-2.5">
              <p className="text-[15px] font-bold">Suas gerações</p>
              <div className="grid grid-cols-3 gap-2.5">
                {meters.map((m) => <QuotaCard key={m.key} m={m} />)}
              </div>
            </div>

            {deliveryTime && (
              <div className="flex flex-col gap-2.5">
                <p className="text-[15px] font-bold">Agendado</p>
                <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-4 flex items-center gap-3.5">
                  <span className="h-11 w-11 rounded-[13px] grid place-items-center shrink-0" style={{ background: "rgba(48,196,107,0.12)", color: "#30C46B" }}>
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15.5px] font-bold leading-tight">Próximo post automático</p>
                    <p className="text-[#8A8A8E] text-[13px] mt-0.5">Gerado e entregue toda manhã</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#30C46B] text-[13px] font-bold leading-tight">{nextWhen}</p>
                    <p className="text-[#30C46B] text-[17px] font-extrabold leading-tight">{deliveryTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== DESKTOP ===== */}
          <div className="hidden lg:flex gap-6">
            {/* Coluna principal */}
            <div className="flex-1 min-w-0 flex flex-col gap-7">
              <div className="flex flex-col gap-3">
                <p className="text-[15px] font-bold">Seu dia</p>
                <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[24px] p-5">
                  {count > 0 && (
                    <Link href="/content" className="flex items-center gap-4 mb-5">
                      <span className="text-[44px] font-extrabold leading-none shrink-0">{count}</span>
                      <div>
                        <p className="text-[19px] font-bold leading-tight">{count === 1 ? "post gerado hoje" : "posts gerados hoje"}</p>
                        <p className="text-[#8A8A8E] text-sm mt-0.5 flex items-center gap-1.5">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                          Ver tudo no Conteúdo
                        </p>
                      </div>
                    </Link>
                  )}
                  <SeuDiaCards />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[15px] font-bold">Suas gerações da semana</p>
                <div className="grid grid-cols-3 gap-4">
                  {meters.map((m) => <QuotaCard key={m.key} m={m} big />)}
                </div>
              </div>
            </div>

            {/* Rail direito */}
            <div className="w-80 shrink-0 flex flex-col gap-4">
              <GenerateButton variant="panel" />

              {deliveryTime && (
                <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-4 flex items-center gap-3.5">
                  <span className="h-11 w-11 rounded-[13px] grid place-items-center shrink-0" style={{ background: "rgba(48,196,107,0.12)", color: "#30C46B" }}>
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold leading-tight">Próximo automático</p>
                    <p className="text-[#8A8A8E] text-[13px] mt-0.5">Gerado toda manhã</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#30C46B] text-[13px] font-bold leading-tight">{nextWhen}</p>
                    <p className="text-[#30C46B] text-[17px] font-extrabold leading-tight">{deliveryTime}</p>
                  </div>
                </div>
              )}

              <div className="bg-[#1A1A1C] border border-white/[0.07] rounded-[20px] p-4 flex items-start gap-3.5">
                <span className="h-11 w-11 rounded-[13px] grid place-items-center shrink-0" style={{ background: "rgba(48,196,107,0.12)", color: "#30C46B" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" /></svg>
                </span>
                <p className="text-[#C7C7CC] text-[14px] leading-relaxed">
                  <b className="text-white">Dica:</b> posts publicados entre 18h e 20h têm 2× mais alcance no seu nicho.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
