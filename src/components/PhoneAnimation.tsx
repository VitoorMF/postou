"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Screen = "hoje" | "novidades" | "conteudo" | "config";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SPRING = { type: "spring" as const, stiffness: 130, damping: 18 };
const EASE_OUT = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ─── Cursor ────────────────────────────────────────────────────────────────
function Cursor({ x, y, tapping }: { x: number; y: number; tapping: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: tapping ? 0.85 : 1, left: `${x}%`, top: `${y}%` }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={SPRING}
      style={{ position: "absolute", pointerEvents: "none", zIndex: 50, transform: "translate(-50%, -50%)" }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 0 0 3px rgba(255,255,255,0.15), 0 4px 14px rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,0,0,0.05)",
      }} />
      <AnimatePresence>
        {tapping && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(255,255,255,0.4)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function IconHome({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconFeed({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 20h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 16v2l1 1" />
    </svg>
  );
}
function IconContent({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconSettings({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconWand({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 128 128" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M108.88 84.58a6.54 6.54 0 0 0-1.88-4.85c-2.07-2-5.66-2.86-12-2.74a104.14 104.14 0 0 0-19.37 2.68A101.56 101.56 0 0 0 63.83 83c-3 1-5.07 1.71-7.48 1.71h-.09a4.64 4.64 0 0 1-4-1.9 5 5 0 0 1-.35-4.67A31.41 31.41 0 0 0 53.7 64.5c-.66-6.45-3.87-10.16-8.82-10.2a5.51 5.51 0 0 0-4.21 1.58c-1.81 1.88-1.84 4.74-1.71 7.75.11 2.74-2.87 5.53-4.65 7.2-4 3.78-7.08 9.3-7.75 14.06-.1.71-.17 1.36-.24 2a8.13 8.13 0 0 1-.65 3.08A68.14 68.14 0 0 1 19.38 95a2 2 0 0 0-.79 1.32c0 .25-.81 6.14 5.15 13.71 4.27 5.43 10.37 7.88 14.3 7.88h.14a3.74 3.74 0 0 0 3.16-1.26c1-1.39 4.87-5.59 6.4-6.41 3.87-2.09 7.77-4 11.28-5.55 8.3-.16 29.49-.3 34.29.89a10 10 0 0 0 2.46.3c3.61 0 7.37-1.81 8.53-5.49a8 8 0 0 0-.38-6.51 7.32 7.32 0 0 0-1.44-1.81c5.15-1.72 6.38-4.9 6.4-7.49zm-8.39 14.61c-.7 2.21-3.84 3.1-6.21 2.51-3.94-1-16.13-1.14-25.2-1.11l.94-.35a128.58 128.58 0 0 1 26.46-6.94c2 .58 3.34 1.44 3.93 2.51a4.26 4.26 0 0 1 .08 3.38zM98.33 89c-16.07 2.46-24.6 5.64-29.7 7.54l-1.51.46a172.06 172.06 0 0 0-21.28 9.68c-2.33 1.25-6.2 5.67-7.43 7.19-1.63.23-7.39-1.08-11.53-6.35-3.71-4.71-4.28-8.4-4.34-9.91 1.88-1.41 5.44-4.14 6.31-5.26 1-1.35 1.23-3 1.47-5.08.06-.56.13-1.17.22-1.84.55-3.86 3.17-8.56 6.53-11.7 2.13-2 6.1-5.72 5.9-10.29-.06-1.4-.17-4 .6-4.8.09-.09.35-.36 1.27-.36 2.79 0 4.43 2.24 4.87 6.61a27.21 27.21 0 0 1-1.51 11.85 8.94 8.94 0 0 0 .8 8.35 8.64 8.64 0 0 0 7.26 3.64c3.12 0 5.53-.79 8.87-1.91a96.7 96.7 0 0 1 11.46-3.24A99.21 99.21 0 0 1 95.16 81c4.86-.09 7.9.44 9.06 1.59a2.47 2.47 0 0 1 .66 2c-.01.8-.03 3.41-6.55 4.41z" />
      <path d="M37.72 44c.15 0 15.42 2.28 21.72 8.58S68 74.13 68 74.28a2 2 0 0 0 4 0c0-.15 2.28-15.42 8.58-21.72S102.13 44 102.28 44a2 2 0 0 0 0-4c-.15 0-15.42-2.28-21.72-8.58S72 9.87 72 9.72a2 2 0 0 0-4 0c0 .15-2.28 15.42-8.58 21.72S37.87 40 37.72 40a2 2 0 0 0 0 4z" />
      <path d="M88 26a2 2 0 0 0 1.41-.59l4-4a2 2 0 0 0-2.82-2.82l-4 4A2 2 0 0 0 88 26zM86.59 58.59a2 2 0 0 0 0 2.82l4 4a2 2 0 0 0 2.82-2.82l-4-4a2 2 0 0 0-2.82 0zM50.59 25.41a2 2 0 0 0 2.82-2.82l-4-4a2 2 0 0 0-2.82 2.82z" />
    </svg>
  );
}
// Marca Postou (avatar redondo)
function PostouAvatar({ size = 30 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#137EFF,#4a9eff)",
      display: "grid", placeItems: "center",
      color: "#fff", fontSize: size * 0.5, fontWeight: 800, fontFamily: "-apple-system, sans-serif",
    }}>p</div>
  );
}

// ─── Bottom Nav (4 abas) ─────────────────────────────────────────────────────
function BottomNav({ active }: { active: 0 | 1 | 2 | 3 | null }) {
  const items = [
    { label: "Hoje", Icon: IconHome },
    { label: "Anotações", Icon: IconFeed },
    { label: "Conteúdo", Icon: IconContent },
    { label: "Config", Icon: IconSettings },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around", padding: "9px 0 13px",
      background: "rgba(14,14,16,0.9)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      zIndex: 20,
    }}>
      {items.map(({ label, Icon }, i) => {
        const isActive = active === i;
        const color = isActive ? "#fff" : "#555";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <Icon color={color} />
            <span style={{ fontSize: 7, color, fontWeight: 600 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Magic burst (faíscas quando o post nasce) ───────────────────────────────
function SparkleBurst() {
  const parts = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const d = 30 + (i % 3) * 10;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, delay: 0.18 + i * 0.018 };
  });
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 6 }}>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0, 1, 0.3] }}
          transition={{ duration: 0.75, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute", width: 5, height: 5, borderRadius: "50%",
            background: "#fff", boxShadow: "0 0 7px 1px rgba(255,255,255,0.85)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Tela: Hoje (dashboard) ──────────────────────────────────────────────────
function StatCard({ icon, used, limit, label, tint, delay }: { icon: React.ReactNode; used: number; limit: number; label: string; tint: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE_OUT, delay }}
      style={{ flex: 1, background: "#161618", border: "1px solid #232325", borderRadius: 12, padding: "9px 8px", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{ width: 22, height: 22, borderRadius: 7, background: `${tint}22`, display: "grid", placeItems: "center" }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
        {used}<span style={{ fontSize: 8, color: "#666", fontWeight: 600 }}>/{limit}</span>
      </div>
      <span style={{ fontSize: 7.5, color: "#888" }}>{label}</span>
    </motion.div>
  );
}

// mini-thumb de post Postou (azul + wordmark)
function PostThumb({ size }: { size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0, overflow: "hidden",
      background: "linear-gradient(150deg,#0d1b3e,#1a3a7a 55%,#137EFF)",
      display: "flex", flexDirection: "column", justifyContent: "space-between", padding: size * 0.14,
    }}>
      <span style={{ fontSize: size * 0.16, color: "#fff", fontWeight: 800, lineHeight: 1.05 }}>Poste<br />todo dia</span>
      <span style={{ fontSize: size * 0.12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>postou</span>
    </div>
  );
}

function HojeScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "30px 14px 54px", display: "flex", flexDirection: "column", gap: 9, overflow: "hidden" }}
    >
      {/* topo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 7.5, letterSpacing: 1.5, color: "#777", fontWeight: 700, margin: 0 }}>SEG · 15 JUN</p>
          <h2 style={{ fontSize: 25, fontWeight: 800, color: "#fff", margin: "2px 0 0", lineHeight: 1 }}>Hoje</h2>
          <p style={{ fontSize: 10, color: "#888", margin: "6px 0 0" }}>Boa tarde 👋</p>
        </div>
        <PostouAvatar size={30} />
      </div>

      {/* Seu dia */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div key="dia" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Seu dia</span>
            <div style={{ background: "#202022", borderRadius: 14, padding: "11px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>1</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>post gerado hoje</p>
                <p style={{ fontSize: 8.5, color: "#888", margin: "2px 0 0" }}>Toque para ver no Conteúdo</p>
              </div>
              <PostThumb size={38} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Criar post (manual) */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            key="criar"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT}
            style={{
              borderRadius: 14, padding: "11px 12px", display: "flex", alignItems: "center", gap: 11,
              background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))",
              border: "1px solid rgba(124,108,255,0.35)",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <IconWand color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Criar post</span>
                <span style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 0.5, color: "#c4b5fd", background: "rgba(139,92,246,0.2)", padding: "2px 5px", borderRadius: 5 }}>MANUAL</span>
              </div>
              <p style={{ fontSize: 8.5, color: "#9aa", margin: "2px 0 0" }}>Você escolhe o tema e o formato</p>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", color: "#fff", fontSize: 12 }}>→</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suas gerações */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div key="ger" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Suas gerações</span>
            <div style={{ display: "flex", gap: 7 }}>
              <StatCard delay={0.05} used={1} limit={3} label="Automáticas" tint="#f59e0b" icon={<svg width="12" height="12" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>} />
              <StatCard delay={0.12} used={0} limit={2} label="Manuais" tint="#137EFF" icon={<svg width="12" height="12" fill="#137EFF" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>} />
              <StatCard delay={0.19} used={0} limit={1} label="Carrossel" tint="#137EFF" icon={<svg width="12" height="12" fill="none" stroke="#137EFF" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2" /><path d="M4 7v10M20 7v10" /></svg>} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agendado */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div key="agd" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Agendado</span>
            <div style={{ background: "#161618", border: "1px solid #232325", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(16,163,74,0.14)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <svg width="15" height="15" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#fff", margin: 0 }}>Próximo post automático</p>
                <p style={{ fontSize: 8, color: "#888", margin: "2px 0 0" }}>Gerado e entregue toda manhã</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 8.5, color: "#22c55e", fontWeight: 700, margin: 0 }}>quarta</p>
                <p style={{ fontSize: 13, color: "#22c55e", fontWeight: 800, margin: 0 }}>07:00</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tela: Novidades ─────────────────────────────────────────────────────────
function UpdateCard({ date, badge, tint, txt, delay, dark }: { date: string; badge: string; tint: string; txt: string; delay: number; dark?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...EASE_OUT, delay }}
      style={{ background: "#202022", borderRadius: 12, padding: "10px 11px", display: "flex", flexDirection: "column", gap: 5 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8, color: "#777" }}>{date}</span>
        <span style={{ background: tint, color: dark ?? "#fff", fontSize: 7.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9 }}>{badge}</span>
      </div>
      <span style={{ fontSize: 10, color: "#eee", lineHeight: 1.35 }}>{txt}</span>
    </motion.div>
  );
}

function NovidadesScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "34px 14px 54px", display: "flex", flexDirection: "column", gap: 9, overflow: "hidden" }}
    >
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Anotações</h3>
        <p style={{ fontSize: 9, color: "#888", margin: "2px 0 0" }}>Anote o que rola no negócio</p>
      </div>

      <p style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1, margin: "2px 0 0" }}>HOJE</p>

      <AnimatePresence>
        {step >= 1 && <UpdateCard key="u1" delay={0} date="hoje" badge="novidade" tint="#137EFF" txt="Lançamos um produto novo essa semana 🚀" />}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 2 && <UpdateCard key="u2" delay={0} date="hoje" badge="promoção" tint="#a855f7" txt="Promoção de fim de semana: 20% de desconto" />}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 2 && <UpdateCard key="u3" delay={0.12} date="ontem" badge="conquista" tint="#eab308" dark="#000" txt="Batemos recorde de vendas no mês 🎉" />}
      </AnimatePresence>

      {/* input */}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 56, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, background: "#1F1F1F", borderRadius: 12, padding: "8px 12px", fontSize: 9, color: "#666" }}>Um detalhe do negócio...</div>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: "#2B2B2B", display: "grid", placeItems: "center" }}>
          <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: "#137EFF", display: "grid", placeItems: "center" }}>
          <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tela: Conteúdo (post da marca + beat de mágica) ─────────────────────────
function ConteudoScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "34px 14px 54px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Conteúdo</h3>
          <p style={{ fontSize: 9, color: "#888", margin: "2px 0 0" }}>Seus posts gerados</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 99, padding: "5px 9px", fontSize: 8, color: "#aaa" }}>
          Tudo <span style={{ fontSize: 7 }}>▾</span>
        </div>
      </div>

      <p style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1, margin: 0 }}>HOJE</p>

      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={EASE_OUT}
            style={{ background: "#161618", border: "1px solid #232325", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* imagem branded (Postou) */}
            <div style={{
              position: "relative", width: "100%", height: 150, overflow: "hidden",
              background: "radial-gradient(120% 95% at 75% 0%, #2a64c8 0%, #14387e 50%, #0a1b3e 100%)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 12,
            }}>
              {/* glow sutil */}
              <div style={{ position: "absolute", top: -16, right: -10, width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,170,255,0.35),transparent 70%)" }} />
              {/* eyebrow */}
              <span style={{ fontSize: 7, letterSpacing: 1.5, color: "rgba(255,255,255,0.6)", fontWeight: 700, position: "relative" }}>DICA DA SEMANA</span>
              {/* título */}
              <div style={{ color: "#fff", lineHeight: 1.1, letterSpacing: "-0.01em", position: "relative" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>Sua marca</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>postando</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>todo dia ✨</div>
              </div>
              {/* wordmark */}
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", fontWeight: 700, position: "relative" }}>postou</span>
              {/* badge count */}
              <span style={{ position: "absolute", bottom: 9, right: 10, display: "flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 7.5, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>
                <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>1
              </span>
              {/* shimmer sweep */}
              <motion.div
                initial={{ x: "-130%" }} animate={{ x: "130%" }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeInOut" }}
                style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "55%", transform: "skewX(-20deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)", mixBlendMode: "screen", zIndex: 5, pointerEvents: "none" }}
              />
              <SparkleBurst />
            </div>

            {/* meta + ações */}
            <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", fontSize: 7, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>post</span>
                <span style={{ fontSize: 7.5, color: "#666" }}>1 imagem · gerado há 5h</span>
              </div>
              <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700, lineHeight: 1.25 }}>Sua marca postando todo dia</span>
              <span style={{ fontSize: 8.5, color: "#888", lineHeight: 1.35 }}>Consistência é o que faz a marca crescer. Veja como manter o feed sempre ativo…</span>
              <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <div style={{ flex: 1, background: "#2b2b2b", borderRadius: 11, padding: "7px 0", textAlign: "center", fontSize: 9, color: "#fff", fontWeight: 600 }}>ver</div>
                <div style={{ flex: 1, background: "#137EFF", borderRadius: 11, padding: "7px 0", textAlign: "center", fontSize: 9, color: "#fff", fontWeight: 600 }}>baixar</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tela: Configurar (gera automático nos dias escolhidos) ──────────────────
function MiniToggle({ on }: { on: boolean }) {
  return (
    <div style={{ width: 30, height: 17, borderRadius: 99, flexShrink: 0, background: on ? "#137EFF" : "#3a3a3a", position: "relative" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: "50%", background: "#fff" }} />
    </div>
  );
}

function ConfigScreen({ step }: { step: number }) {
  const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
  const active = [0, 2, 4]; // seg / qua / sex
  const rows = [
    { label: "Carrossel", sub: "Slides do evento do dia", on: false },
    { label: "Post", sub: "1 imagem de destaque", on: false },
    { label: "Story", sub: "1 imagem vertical", on: false },
    { label: "IA decide", sub: "A IA escolhe o tipo", on: true },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, overflow: "hidden", paddingBottom: 54 }}
    >
      <div style={{ padding: "34px 14px 8px", background: "#0e0e0e", position: "relative", zIndex: 2 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Configurar</h3>
        <p style={{ fontSize: 9, color: "#888", margin: "2px 0 0" }}>Escolha o que gerar todo dia</p>
      </div>

      <motion.div
        animate={{ y: step >= 1 ? -172 : 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: "6px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1 }}>O QUE GERAR</span>
          <div style={{ background: "#1c1c1c", borderRadius: 12 }}>
            {rows.map((r, i) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", gap: 10, borderTop: i ? "1px solid #2a2a2a" : "none" }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#fff", margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 7.5, color: "#777", margin: "1px 0 0" }}>{r.sub}</p>
                </div>
                <MiniToggle on={r.on} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1 }}>HORÁRIO DE ENTREGA</span>
          <div style={{ background: "#1c1c1c", borderRadius: 12, padding: "11px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#fff", margin: 0 }}>Gerar todo dia às</p>
              <p style={{ fontSize: 7.5, color: "#777", margin: "1px 0 0" }}>Te avisamos quando ficar pronto</p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#137EFF" }}>07:00</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1 }}>DIAS DA SEMANA</span>
          <div style={{ background: "#1c1c1c", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 9 }}>
            <p style={{ fontSize: 8.5, color: "#777", margin: 0 }}>Gerar só nos dias selecionados</p>
            <div style={{ display: "flex", gap: 5 }}>
              {DAYS.map((d, i) => {
                const lit = step >= 2 && active.includes(i);
                return (
                  <motion.div
                    key={i}
                    animate={lit ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, delay: lit ? active.indexOf(i) * 0.12 : 0, ease: "easeOut" }}
                    style={{
                      flex: 1, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
                      fontSize: 11, fontWeight: 700,
                      background: lit ? "#137EFF" : "#2b2b2b",
                      color: lit ? "#fff" : "#777",
                      boxShadow: lit ? "0 0 14px rgba(19,126,255,0.5)" : "none",
                      transition: "background .35s, color .35s, box-shadow .35s",
                    }}
                  >
                    {d}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function PhoneAnimation() {
  const [screen, setScreen] = useState<Screen>("hoje");
  const [step, setStep] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [tapping, setTapping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const tapAt = async (x: number, y: number, approachY = 70) => {
      setCursor({ x, y: approachY });
      setCursorVisible(true);
      await sleep(450);
      setCursor({ x, y });
      await sleep(720);
      setTapping(true);
      await sleep(220);
      setTapping(false);
      await sleep(150);
    };

    async function loop() {
      while (!cancelled) {
        // ── Hoje ──
        setScreen("hoje"); setStep(0); setCursorVisible(false);
        await sleep(450); setStep(1); await sleep(500); setStep(2); await sleep(550);
        setStep(3); await sleep(600); setStep(4); await sleep(1100);
        await tapAt(37.5, 94); // → Novidades

        // ── Novidades ──
        setScreen("novidades"); setStep(0); setCursorVisible(false);
        await sleep(450); setStep(1); await sleep(700); setStep(2); await sleep(1300);
        await tapAt(62.5, 94); // → Conteúdo

        // ── Conteúdo ──
        setScreen("conteudo"); setStep(0); setCursorVisible(false);
        await sleep(500); setStep(1); await sleep(2000);
        await tapAt(87.5, 94); // → Configurar

        // ── Configurar ──
        setScreen("config"); setStep(0); setCursorVisible(false);
        await sleep(850); setStep(1); await sleep(1200); setStep(2); await sleep(1900);

        await sleep(300);
      }
    }

    loop();
    return () => { cancelled = true; };
  }, []);

  const navActive: 0 | 1 | 2 | 3 | null =
    screen === "hoje" ? 0
      : screen === "novidades" ? 1
        : screen === "conteudo" ? 2
          : screen === "config" ? 3
            : null;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      overflow: "hidden", borderRadius: 12, background: "#0e0e0e",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <AnimatePresence mode="wait">
        {screen === "hoje" && <HojeScreen key="hj" step={step} />}
        {screen === "novidades" && <NovidadesScreen key="nv" step={step} />}
        {screen === "conteudo" && <ConteudoScreen key="ct" step={step} />}
        {screen === "config" && <ConfigScreen key="cf" step={step} />}
      </AnimatePresence>

      <BottomNav active={navActive} />

      <AnimatePresence>
        {cursorVisible && <Cursor key="cur" x={cursor.x} y={cursor.y} tapping={tapping} />}
      </AnimatePresence>
    </div>
  );
}
