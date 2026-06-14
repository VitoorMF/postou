"use client";

import { useEffect, useRef, useState } from "react";

const CARDS = [
  {
    label: "01 — INPUT",
    title: "Você alimenta a memória",
    body: '“Fechei uma parceria”, “viralizou no LinkedIn”, “novo produto lançado”. O Postou entende o que importa.',
  },
  {
    label: "02 — REASONING",
    title: "As conexões aparecem",
    body: "O Postou relaciona suas novidades com o histórico da marca, conteúdos anteriores e o que performa no seu nicho.",
  },
  {
    label: "03 — OUTPUT",
    title: "O conteúdo evolui",
    body: "Quanto mais sua marca usa o Postou, mais alinhado fica o conteúdo gerado.",
  },
];

// ─── Neural network viz ────────────────────────────────────────────────────
type Node = {
  x: number; y: number; z: number;
  phase: number;
  drift: number;
  driftSpeed: number;
  size: number;
};
type Edge = [number, number];
type State = { nodes: Node[]; edges: Edge[] };

function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function buildState(seed: number, count: number): State {
  const r = rng(seed);
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const z = r();
    nodes.push({
      x: 0.08 + r() * 0.84,
      y: 0.08 + r() * 0.84,
      z,
      phase: r() * Math.PI * 2,
      drift: r() * Math.PI * 2,
      driftSpeed: 0.0003 + r() * 0.0006,
      size: 1.4 + r() * 4.2 * (0.4 + z * 0.8),
    });
  }
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      dists.push({ j, d: dx * dx + dy * dy });
    }
    dists.sort((a, b) => a.d - b.d);
    const k = 2 + Math.floor(rng(seed + i + 1)() * 2);
    for (let m = 0; m < k && m < dists.length; m++) {
      const a = i, b = dists[m].j;
      edges.push(a < b ? [a, b] : [b, a]);
    }
  }
  const seen = new Set<string>();
  const uniq: Edge[] = [];
  edges.forEach((e) => {
    const key = `${e[0]}-${e[1]}`;
    if (!seen.has(key)) { seen.add(key); uniq.push(e); }
  });
  return { nodes, edges: uniq };
}

const COUNT = 36;
const TINTS: [number, number, number][] = [
  [225, 78, 60],
  [218, 72, 64],
  [232, 80, 58],
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function NeuralCanvas({ targetIdx }: { targetIdx: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    current: 0,
    target: 0,
    blend: 1,
    mx: 0, my: 0,
    running: true,
    // tint interpolada congelada (quando interrompemos mid-morph)
    frozenTint: null as [number, number, number] | null,
  });
  const statesRef = useRef<State[] | null>(null);
  // estado "frozen" — snapshot do visual atual quando user interrompe um morph em andamento
  const frozenRef = useRef<State | null>(null);

  // sync target from prop
  useEffect(() => {
    const s = stateRef.current;
    const states = statesRef.current;
    if (targetIdx === s.target) return;

    if (s.blend < 1 && states) {
      // captura snapshot do estado visual atual (interpolado)
      // se já está em estado frozen (-1), pega do frozenRef; senão, do states[s.current]
      const usingFrozen = s.current === -1 && frozenRef.current;
      const A = usingFrozen ? frozenRef.current!.nodes : states[s.current].nodes;
      const B = states[s.target].nodes;
      const tA = usingFrozen ? s.frozenTint! : TINTS[s.current];
      const tB = TINTS[s.target];
      const t = ease(s.blend);
      const frozenNodes: Node[] = A.map((a, i) => {
        const b = B[i];
        return {
          x: lerp(a.x, b.x, t),
          y: lerp(a.y, b.y, t),
          z: lerp(a.z, b.z, t),
          phase: a.phase,
          drift: a.drift,
          driftSpeed: a.driftSpeed,
          size: lerp(a.size, b.size, t),
        };
      });
      frozenRef.current = { nodes: frozenNodes, edges: states[s.target].edges };
      s.frozenTint = [
        lerp(tA[0], tB[0], t),
        lerp(tA[1], tB[1], t),
        lerp(tA[2], tB[2], t),
      ];
      s.current = -1;
    }
    s.target = targetIdx;
    s.blend = 0;
  }, [targetIdx]);

  useEffect(() => {
    statesRef.current = [
      buildState(11, COUNT),
      buildState(47, COUNT),
      buildState(83, COUNT),
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 10) {
        // tenta de novo no próximo frame até o canvas existir de verdade
        requestAnimationFrame(resize);
        return;
      }
      W = r.width; H = r.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // a página inteira dirige o parallax (normaliza pela viewport)
    const onMove = (e: PointerEvent) => {
      stateRef.current.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      stateRef.current.my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onLeave = () => { stateRef.current.mx = 0; stateRef.current.my = 0; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    // pausa quando sai da viewport (otimização opcional — Safari pode falhar aqui)
    let visIO: IntersectionObserver | null = null;
    try {
      visIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => { stateRef.current.running = e.isIntersecting; });
      }, { threshold: 0.05 });
      visIO.observe(canvas);
    } catch {
      // ignora se Safari rejeitar
    }

    const draw = (now: number) => {
      const states = statesRef.current;
      const st = stateRef.current;
      if (!states || W === 0) return;

      const useFrozen = st.current === -1 && frozenRef.current !== null;
      const A = useFrozen ? frozenRef.current!.nodes : states[st.current].nodes;
      const B = states[st.target].nodes;
      const tA = useFrozen ? st.frozenTint! : TINTS[st.current];
      const tB = TINTS[st.target];
      const t = ease(st.blend);

      const tint: [number, number, number] = [
        lerp(tA[0], tB[0], t),
        lerp(tA[1], tB[1], t),
        lerp(tA[2], tB[2], t),
      ];

      const proj: { x: number; y: number; z: number; size: number; phase: number }[] = [];
      for (let i = 0; i < A.length; i++) {
        const a = A[i], b = B[i];
        const driftAx = Math.sin(now * a.driftSpeed + a.drift) * 0.012;
        const driftBx = Math.sin(now * b.driftSpeed + b.drift) * 0.012;
        const driftAy = Math.cos(now * a.driftSpeed * 1.3 + a.drift) * 0.008;
        const driftBy = Math.cos(now * b.driftSpeed * 1.3 + b.drift) * 0.008;
        const x = lerp(a.x + driftAx, b.x + driftBx, t);
        const y = lerp(a.y + driftAy, b.y + driftBy, t);
        const z = lerp(a.z, b.z, t);
        const breath = 1 + Math.sin(now * 0.0014 + a.phase) * 0.18;
        const size = lerp(a.size, b.size, t) * breath;
        const px = st.mx * 14 * (0.4 + z * 0.9);
        const py = st.my * 14 * (0.4 + z * 0.9);
        proj.push({ x: x * W + px, y: y * H + py, z, size, phase: a.phase });
      }

      ctx.clearRect(0, 0, W, H);

      const edgesA = useFrozen ? frozenRef.current!.edges : states[st.current].edges;
      const edgesB = states[st.target].edges;
      const setA = new Set(edgesA.map((e) => `${e[0]}-${e[1]}`));
      const setB = new Set(edgesB.map((e) => `${e[0]}-${e[1]}`));
      const all = new Set([...setA, ...setB]);

      ctx.lineCap = "round";
      all.forEach((key) => {
        const [i, j] = key.split("-").map(Number);
        const a = proj[i], b = proj[j];
        if (!a || !b) return;
        const inA = setA.has(key);
        const inB = setB.has(key);
        let alpha: number;
        if (inA && inB) alpha = 1;
        else if (inA && !inB) alpha = 1 - t;
        else alpha = t;
        if (alpha < 0.02) return;

        const z = (a.z + b.z) * 0.5;
        const pulse = 0.7 + Math.sin(now * 0.0018 + (i + j)) * 0.3;
        const baseA = 0.12 + z * 0.32;
        ctx.globalAlpha = baseA * alpha * pulse;
        ctx.strokeStyle = `hsl(${tint[0]}, ${tint[1]}%, ${tint[2]}%)`;
        ctx.lineWidth = 0.5 + z * 1.1;
        if (z < 0.4) {
          ctx.shadowColor = `hsla(${tint[0]}, ${tint[1]}%, ${tint[2] + 10}%, 0.4)`;
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      const order = proj.map((_, i) => i).sort((i, j) => proj[i].z - proj[j].z);
      order.forEach((i) => {
        const n = proj[i];
        const z = n.z;
        const haloR = n.size * (2 + z * 2.5);
        const haloAlpha = (0.06 + z * 0.12) * (0.7 + Math.sin(now * 0.0014 + n.phase) * 0.3);
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        grd.addColorStop(0, `hsla(${tint[0]}, ${tint[1]}%, ${tint[2] + 10}%, ${haloAlpha})`);
        grd.addColorStop(1, `hsla(${tint[0]}, ${tint[1]}%, ${tint[2] + 10}%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        const coreA = 0.55 + z * 0.45;
        const lightness = tint[2] + z * 18;
        ctx.fillStyle = `hsla(${tint[0]}, ${tint[1]}%, ${lightness}%, ${coreA})`;
        if (z < 0.45) {
          ctx.shadowColor = `hsla(${tint[0]}, ${tint[1]}%, ${lightness}%, 0.6)`;
          ctx.shadowBlur = 4 + (0.45 - z) * 16;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    let raf = 0;
    const tick = (now: number) => {
      const st = stateRef.current;
      if (!st.running) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (st.blend < 1) {
        st.blend = Math.min(1, st.blend + 0.014);
        if (st.blend >= 1) {
          st.current = st.target;
          frozenRef.current = null;
          st.frozenTint = null;
        }
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      visIO?.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }} />;
}

// ─── Section ──────────────────────────────────────────────────────────────
export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const lastInteractRef = useRef(typeof window !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    const id = setInterval(() => {
      if (performance.now() - lastInteractRef.current > 7000) {
        setActive((a) => {
          const next = (a + 1) % CARDS.length;
          lastInteractRef.current = performance.now() - 0;
          return next;
        });
      }
    }, 1500);
    return () => clearInterval(id);
  }, []);

  function handleSelect(i: number) {
    lastInteractRef.current = performance.now();
    setActive(i);
  }

  return (
    <section id="como-funciona" className="hiw">
      <div className="hiw-wrap">
        <div className="hiw-grid">
          <div className="hiw-viz">
            <NeuralCanvas targetIdx={active} />
          </div>

          <div className="hiw-content">
            <div className="hiw-head">
              <span className="sec-tag">Como funciona</span>
              <h2>A IA pensa.<br />Você só posta.</h2>
              <p>O Postou conecta atualizações, identidade visual, tom de voz e histórico da marca para gerar conteúdo continuamente.</p>
            </div>

            <div className="hiw-cards" role="tablist">
              {CARDS.map((card, i) => (
                <button
                  key={i}
                  className={`hiw-card ${active === i ? "active" : ""}`}
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => handleSelect(i)}
                  onFocus={() => handleSelect(i)}
                >
                  <div className="hiw-card-top">
                    <span className="hiw-card-num">{card.label}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <div className="hiw-card-body">
                    <div><p>{card.body}</p></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hiw {
          background: #252527;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 100px 0;
          overflow: hidden;
          position: relative;
        }
        .hiw-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .hiw-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 60px;
          align-items: center;
          height: 640px;
        }
        .hiw-content {
          min-width: 0;
        }
        .hiw-viz {
          position: relative;
          width: 100%;
          height: 640px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hiw-viz::before {
          content: "";
          position: absolute;
          inset: 10% 10%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(65,105,225,0.18), transparent 65%);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
          transition: opacity 1.2s cubic-bezier(0.16,1,0.3,1);
        }
        .hiw-head { margin-bottom: 40px; }
        .hiw-head h2 {
          font-size: 48px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 10px;
          letter-spacing: -0.025em;
          line-height: 1.05;
        }
        .hiw-head p {
          color: #a0a0a8;
          font-size: 17px;
          margin: 0;
          line-height: 1.5;
          max-width: 480px;
          text-wrap: pretty;
        }
        .hiw-cards {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 440px;
        }
        .hiw-card {
          appearance: none;
          text-align: left;
          cursor: pointer;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 24px 26px;
          color: inherit;
          font: inherit;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.35s cubic-bezier(0.16,1,0.3,1),
                      background 0.35s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .hiw-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14%;
          bottom: 14%;
          width: 3px;
          background: #4169e1;
          border-radius: 0 3px 3px 0;
          transform: scaleY(0);
          transform-origin: center;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .hiw-card:hover { border-color: rgba(255,255,255,0.16); }
        .hiw-card.active {
          border-color: #4169e1;
          background: linear-gradient(180deg, rgba(65,105,225,0.06), rgba(65,105,225,0));
          box-shadow: 0 0 0 1px rgba(65,105,225,0.35), 0 14px 40px -20px rgba(65,105,225,0.4);
        }
        .hiw-card.active::before { transform: scaleY(1); }
        .hiw-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hiw-card-num {
          font-size: 13px;
          font-weight: 700;
          color: #6e6e7a;
          letter-spacing: 0.16em;
          font-variant-numeric: tabular-nums;
          transition: color 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .hiw-card.active .hiw-card-num { color: #4169e1; }
        .hiw-card h3 {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .hiw-card-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.45s cubic-bezier(0.16,1,0.3,1),
                      margin-top 0.35s cubic-bezier(0.16,1,0.3,1);
          margin-top: 0;
        }
        .hiw-card-body > div { overflow: hidden; }
        .hiw-card.active .hiw-card-body {
          grid-template-rows: 1fr;
          margin-top: 10px;
        }
        .hiw-card-body p {
          margin: 0;
          color: #a0a0a8;
          font-size: 15.5px;
          line-height: 1.6;
          max-width: 520px;
        }

        @media (max-width: 880px) {
          .hiw { padding: 72px 0; }
          .hiw-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            height: auto;
          }
          .hiw-viz {
            height: 360px;
            order: -1;
          }
          .hiw-cards {
            min-height: 0;
          }
          .hiw-head h2 { font-size: 36px; }
          .hiw-head { margin-bottom: 28px; }
        }
      `}</style>
    </section>
  );
}
