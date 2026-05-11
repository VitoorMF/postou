"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Screen = "novidades" | "conteudo" | "post" | "success";

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

// ─── Bottom Nav ────────────────────────────────────────────────────────────
function BottomNav({ active }: { active: 0 | 1 | 2 | null }) {
  const items = [
    { label: "Feed", Icon: IconFeed },
    { label: "Conteúdo", Icon: IconContent },
    { label: "Config", Icon: IconSettings },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "space-around", padding: "10px 0 14px",
      background: "rgba(20,20,20,0.85)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      zIndex: 10,
    }}>
      {items.map(({ label, Icon }, i) => {
        const isActive = active === i;
        const color = isActive ? "#fff" : "#555";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <Icon color={color} />
            <span style={{ fontSize: 7.5, color, fontWeight: 600 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Screens ───────────────────────────────────────────────────────────────
function NovidadesScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "38px 12px 60px", display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Novidades</h3>
        <p style={{ fontSize: 9, color: "#666", margin: "2px 0 0" }}>O que aconteceu hoje?</p>
      </div>

      <p style={{ fontSize: 7, color: "#555", fontWeight: 700, letterSpacing: 1, margin: 0 }}>HOJE</p>

      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            key="u1"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={EASE_OUT}
            style={{ background: "#1c1c1c", borderRadius: 10, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 8, color: "#666" }}>02 mai</span>
              <span style={{ background: "#16a34a", color: "#fff", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>parceria</span>
            </div>
            <span style={{ fontSize: 10, color: "#fff", lineHeight: 1.3 }}>Nova parceria fechada com escritório de Brasília</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            key="u2"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={EASE_OUT}
            style={{ background: "#1c1c1c", borderRadius: 10, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 8, color: "#666" }}>02 mai</span>
              <span style={{ background: "#eab308", color: "#000", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>conquista</span>
            </div>
            <span style={{ fontSize: 10, color: "#fff", lineHeight: 1.3 }}>Artigo viralizou no LinkedIn — +500 compartilhamentos</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            key="u3"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...EASE_OUT, delay: 0.15 }}
            style={{ background: "#1c1c1c", borderRadius: 10, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 8, color: "#666" }}>01 mai</span>
              <span style={{ background: "#a855f7", color: "#fff", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>evento</span>
            </div>
            <span style={{ fontSize: 10, color: "#fff", lineHeight: 1.3 }}>Palestrei pra 400 pessoas no Congresso AgroFuturo</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input "O que aconteceu hoje?" */}
      <div style={{
        position: "absolute", left: 12, right: 12, bottom: 60,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{
          flex: 1, background: "#1F1F1F", borderRadius: 12, padding: "8px 12px",
          fontSize: 9, color: "#666",
        }}>
          O que aconteceu hoje?
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 9, background: "#2B2B2B",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 9, background: "#137EFF",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function ConteudoScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "38px 12px 60px", display: "flex", flexDirection: "column", gap: 10 }}
    >
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE_OUT}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Conteúdo</h3>
            <p style={{ fontSize: 9, color: "#666", margin: "2px 0 0" }}>Seus posts gerados</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            key="posts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_OUT, delay: 0.1 }}
              style={{ background: "#1c1c1c", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{
                width: "100%", height: 130, borderRadius: 7, overflow: "hidden",
                background: "linear-gradient(145deg, #0d1b3e 0%, #1a3a7a 50%, #137EFF 100%)",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 10,
              }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 800, lineHeight: 1.15, textAlign: "center" }}>Nova parceria<br />fechada 🤝</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>post</span>
                <span style={{ fontSize: 7, color: "#666" }}>1 imagem · hoje</span>
              </div>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, lineHeight: 1.25 }}>Nova parceria fechada</span>
              <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                <div style={{ flex: 1, background: "#2b2b2b", borderRadius: 12, padding: "5px 0", textAlign: "center", fontSize: 8, color: "#fff", fontWeight: 600 }}>ver</div>
                <div style={{ flex: 1, background: "#137EFF", borderRadius: 12, padding: "5px 0", textAlign: "center", fontSize: 8, color: "#fff", fontWeight: 600 }}>baixar</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...EASE_OUT, delay: 0.2 }}
              style={{ background: "#1c1c1c", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div style={{
                width: "100%", height: 130, borderRadius: 7, overflow: "hidden",
                background: "linear-gradient(145deg, #1a3a2a 0%, #166534 50%, #16a34a 100%)",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 10,
              }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 800, lineHeight: 1.15, textAlign: "center" }}>Artigo<br />viralizou ✨</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>post</span>
                <span style={{ fontSize: 7, color: "#666" }}>1 imagem · ontem</span>
              </div>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, lineHeight: 1.25 }}>Artigo viralizou no LinkedIn</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PostScreen({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={EASE_OUT}
      style={{ position: "absolute", inset: 0, padding: "38px 12px 16px", display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* back / delete */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#888" }}>‹</div>
        <span style={{ fontSize: 7.5, color: "#888" }}>02 mai</span>
      </div>

      {/* image */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            key="img"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE_OUT}
            style={{
              width: "100%", aspectRatio: "4/5", borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(145deg, #0d1b3e 0%, #1a3a7a 50%, #137EFF 100%)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              padding: 12, position: "relative", overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: 1 }}>PARCERIA</span>
            <span style={{ fontSize: 14, color: "#fff", fontWeight: 800, lineHeight: 1.15 }}>Nova parceria<br />fechada 🤝</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>postou</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* caption */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE_OUT}
            style={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <span style={{ fontSize: 7, color: "#666", fontWeight: 700, letterSpacing: 1 }}>LEGENDA</span>
            <span style={{ fontSize: 8.5, color: "#aaa", lineHeight: 1.4 }}>Fechamos uma parceria incrível que vai elevar...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* baixar */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            key="dl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE_OUT}
            style={{
              background: "#137EFF", borderRadius: 18, padding: "8px 0",
              fontSize: 9.5, color: "#fff", fontWeight: 700, textAlign: "center",
              marginTop: "auto",
            }}
          >
            ↓ Baixar imagem
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: "#0e0e0e",
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #137EFF 0%, #4a9eff 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(19,126,255,0.5)",
        }}
      >
        <motion.svg
          width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
          />
        </motion.svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      >
        <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>Pronto!</span>
        <span style={{ fontSize: 9, color: "#666" }}>post salvo no seu dispositivo</span>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function PhoneAnimation() {
  const [screen, setScreen] = useState<Screen>("novidades");
  const [step, setStep] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [tapping, setTapping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        // ── Tela 1: Novidades — updates entram ──
        setScreen("novidades");
        setStep(1);
        setCursorVisible(false);
        await sleep(500);
        setStep(2);
        await sleep(900);
        setStep(3);
        await sleep(1300);

        // cursor → nav "Conteúdo"
        setCursor({ x: 65, y: 70 });
        setCursorVisible(true);
        await sleep(500);
        setCursor({ x: 50, y: 93 });
        await sleep(850);
        setTapping(true);
        await sleep(220);
        setTapping(false);
        await sleep(180);

        // ── Tela 2: Conteúdo ──
        setScreen("conteudo");
        setStep(0);
        setCursorVisible(false);
        await sleep(450);
        setStep(1);
        await sleep(350);
        setStep(2);
        await sleep(1100);

        // cursor → botão "ver" do post
        setCursor({ x: 30, y: 30 });
        setCursorVisible(true);
        await sleep(450);
        setCursor({ x: 25, y: 48 });
        await sleep(700);
        setTapping(true);
        await sleep(220);
        setTapping(false);
        await sleep(180);

        // ── Tela 3: Post detail ──
        setScreen("post");
        setStep(0);
        setCursorVisible(false);
        await sleep(450);
        setStep(1);
        await sleep(550);
        setStep(2);
        await sleep(700);
        setStep(3);
        await sleep(800);

        // cursor → baixar
        setCursor({ x: 30, y: 95 });
        setCursorVisible(true);
        await sleep(450);
        setCursor({ x: 50, y: 92 });
        await sleep(650);
        setTapping(true);
        await sleep(220);
        setTapping(false);
        await sleep(180);

        // ── Tela 4: Sucesso ──
        setScreen("success");
        setCursorVisible(false);
        await sleep(1900);

        // reset suave
        await sleep(200);
      }
    }

    loop();
    return () => { cancelled = true; };
  }, []);

  const navActive: 0 | 1 | 2 | null =
    screen === "novidades" ? 0
      : screen === "conteudo" ? 1
        : null;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      overflow: "hidden", borderRadius: 12, background: "#0e0e0e",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <AnimatePresence mode="wait">
        {screen === "novidades" && <NovidadesScreen key="nv" step={step} />}
        {screen === "conteudo" && <ConteudoScreen key="ct" step={step} />}
        {screen === "post" && <PostScreen key="pt" step={step} />}
        {screen === "success" && <SuccessScreen key="sc" />}
      </AnimatePresence>

      {screen !== "success" && screen !== "post" && <BottomNav active={navActive} />}

      <AnimatePresence>
        {cursorVisible && <Cursor key="cur" x={cursor.x} y={cursor.y} tapping={tapping} />}
      </AnimatePresence>
    </div>
  );
}
