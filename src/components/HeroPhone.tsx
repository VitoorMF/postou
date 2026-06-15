"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneAnimation from "./PhoneAnimation";

const DEMO_VIDEO_SRC = "/videos/demo.mp4"; // grava com QuickTime e bota aqui

export function HeroPhone() {
  const [open, setOpen] = useState(false);
  const [phoneSize, setPhoneSize] = useState({ width: 360, height: 720 });
  const stageRef = useRef<HTMLDivElement>(null);

  // calcula tamanho do phone expandido respeitando viewport (mantém aspect 1:2)
  useEffect(() => {
    const compute = () => {
      // deixa espaço pro X no topo (80px) e padding lateral
      const maxH = Math.min(window.innerHeight - 100, 760);
      const maxW = Math.min(window.innerWidth - 40, 380);
      let h = maxH;
      let w = h / 2; // aspect 1:2
      if (w > maxW) {
        w = maxW;
        h = w * 2;
      }
      setPhoneSize({ width: Math.round(w), height: Math.round(h) });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // listener global pra o botão "Ver demonstração"
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("postou:open-demo", onOpen);
    return () => window.removeEventListener("postou:open-demo", onOpen);
  }, []);

  // tilt 3D + parallax dos cards seguindo o mouse (página inteira)
  useEffect(() => {
    if (open) return; // sem tilt com o modal aberto
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = stageRef.current;
        if (!el) return;
        const nx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        const ny = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        el.style.setProperty("--tilt-y", `${(nx * 8).toFixed(2)}deg`);
        el.style.setProperty("--tilt-x", `${(-ny * 8).toFixed(2)}deg`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [open]);

  // zera o tilt ao abrir (FLIP do modal parte de um estado neutro)
  useEffect(() => {
    if (!open || !stageRef.current) return;
    const el = stageRef.current;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // trava scroll quando aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      {/* phone na hero (esconde quando aberto, o expandido vira o palco) */}
      <div
        ref={stageRef}
        className="phone-stage phone-load"
        style={{
          opacity: open ? 0 : 1,
          transition: "opacity 0.3s ease",
          pointerEvents: open ? "none" : "auto",
        }}
      >
        <div className="phone-tilt">
          <motion.div
            layoutId="hero-phone"
            className="phone"
            style={{
              animation: open ? "none" : undefined, // pausa o float quando vai abrir
            }}
          >
            <div className="phone-screen">
              <div className="phone-notch"></div>
              <div className="carousel-stage" style={{ padding: 0, alignItems: "stretch", justifyContent: "stretch" }}>
                <PhoneAnimation />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* modal expandido */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(7, 7, 10, 0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {/* botão fechar */}
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                zIndex: 10,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Fechar"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* phone expandido — mesma layoutId faz o FLIP animation */}
            <motion.div
              layoutId="hero-phone"
              className="phone"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: phoneSize.width,
                height: phoneSize.height,
                animation: "none", // sem float quando expandido
              }}
            >
              <div className="phone-screen">
                <div className="phone-notch"></div>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: "30px",
                }}>
                  <video
                    src={DEMO_VIDEO_SRC}
                    autoPlay
                    loop
                    playsInline
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // placeholder se ainda não tem vídeo
                      (e.target as HTMLVideoElement).style.display = "none";
                    }}
                  />
                  {/* placeholder visível enquanto vídeo não existe */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: "center",
                    padding: 24,
                    pointerEvents: "none",
                  }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Vídeo em breve</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function DemoTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("postou:open-demo"))}
    >
      {children}
    </button>
  );
}
