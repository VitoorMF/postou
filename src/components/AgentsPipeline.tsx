"use client";

// Seção "Como funciona" da landing — pipeline real do generate-pack.
// Ponto de partida (auto/manual) → 4 agentes (Bibliotecário/Diretor/Roteirista/
// Artista) → resultado entregue. Personagens 3D em public/agents/*.png.
// Cards compactos; clicar expande os detalhes (acordeão — um aberto por vez).

import { useState } from "react";

const AGENTS = [
  {
    num: "01", img: "/agents/bibliotecario.png", name: "Bibliotecário", role: "Memória & Pesquisa",
    intro: "Não escreve nada. Só reúne o material pra IA conhecer a marca antes de qualquer decisão.",
    bullets: ["Abre o brand kit: tom de voz, paleta, logo e fotos", "Resgata posts e estruturas já usadas", "Lê as anotações recentes do feed", "Organiza tudo pros próximos agentes"],
    note: "Ranqueia as anotações do feed por busca vetorial — entram as mais relevantes pro momento.",
  },
  {
    num: "02", img: "/agents/diretor.png", name: "Diretor", role: "Estratégia",
    intro: "Pensa a estratégia: o que falar e como — quando o tema não veio de você.",
    bullets: ["Brainstorm de ~10 temas e escolhe o menos óbvio", "Decide usar (ou não) o rosto do dono", "Define o formato: post, story ou carrossel", "Escolhe a estrutura do post"],
    callout: "Deu o tema você mesmo? Então você é o diretor — esse passo é seu, o agente é pulado.",
    note: "A estrutura (mito × verdade, passo a passo…) é sorteada por rotação, não pela IA — pra não viciar no óbvio.",
  },
  {
    num: "03", img: "/agents/roteirista.png", name: "Roteirista", role: "Roteiro & Copy",
    intro: "Escreve de verdade — o texto que vai aparecer dentro da arte.",
    bullets: ["Cria o título que prende", "Escreve o texto de cada slide", "Monta a legenda com call-to-action", "Entrega o briefing pro Artista"],
    note: "1 slide pra post e story; 4–5 pra carrossel, cada um com seu papel — capa, corpo, CTA.",
  },
  {
    num: "04", img: "/agents/artista.png", name: "Artista", role: "Design & Visual",
    intro: "Transforma o roteiro em imagem de verdade, com a cara da marca.",
    bullets: ["Aplica paleta, logo e fotos de referência", "Gera a capa e usa ela como molde", "Cada slide sai parte do mesmo conjunto", "Imagem otimizada, pronta pra publicar"],
    note: "Geração resiliente: se uma imagem falha, só ela é refeita — o resto do post continua de pé.",
  },
];

const EXAMPLES = ["/examples/ex-1.png", "/examples/ex-2.png", "/examples/ex-3.png"];

export default function AgentsPipeline() {
  const [open, setOpen] = useState<number | null>(null);
  const [front, setFront] = useState(0);

  // posição de cada capa no leque a partir de qual está "na frente"
  const fanSlot = (j: number) => {
    if (j === front) return "c";
    const others = [0, 1, 2].filter((x) => x !== front);
    return j === others[0] ? "l" : "r";
  };

  return (
    <section id="como-funciona" className="ap">
      <div className="ap-wrap">
        <div className="ap-head">
          <span className="sec-tag">Como funciona</span>
          <h2>Por trás de cada post,<br />uma IA que trabalha por você.</h2>
          <p>Quatro agentes especializados em sequência — da memória da marca ao post pronto pra publicar.</p>
        </div>

        {/* Ponto de partida */}
        <div className="ap-start">
          <div className="ap-start-label">
            <span className="sec-tag">Ponto de partida</span>
            <strong>Tudo começa de 2 jeitos</strong>
          </div>
          <div className="ap-start-opt">
            <span className="ap-start-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg></span>
            <div><p className="ap-start-t">Automático</p><p className="ap-start-d">Todo dia, no horário que a marca configurou. Você nem precisa abrir o app.</p></div>
          </div>
          <div className="ap-start-opt">
            <span className="ap-start-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></span>
            <div><p className="ap-start-t">Manual</p><p className="ap-start-d">Você dá o tema (ou deixa em branco) e escolhe o formato. Aqui, <span className="ap-hl">você vira o diretor</span>.</p></div>
          </div>
          <div className="ap-start-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg><span>os 4 agentes assumem</span></div>
        </div>

        {/* Pipeline */}
        <div className="ap-row">
          {AGENTS.map((a, i) => {
            const isOpen = open === i;
            return (
              <div key={a.num} className={`ap-card ${isOpen ? "open" : ""}`}>
                <button
                  className="ap-card-head"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <div className="ap-stage">
                    <img src={a.img} alt={a.name} className="ap-img" loading="lazy" />
                  </div>
                  <span className="ap-num">{a.num}</span>
                  <h3>{a.name}</h3>
                  <p className="ap-role">{a.role}</p>
                  <p className="ap-intro">{a.intro}</p>
                  <span className="ap-toggle">
                    {isOpen ? "Menos" : "Como funciona"}
                    <svg className="ap-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </button>

                <div className="ap-more">
                  <div>
                    <ul className="ap-bullets">
                      {a.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                    {a.callout && (
                      <div className="ap-callout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
                        <span>{a.callout}</span>
                      </div>
                    )}
                    <div className="ap-foot"><span className="ap-foot-arr">↳</span><p>{a.note}</p></div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Resultado — 5º item: full-width no desktop, card no carrossel mobile */}
          <div className="ap-result">
            <div className="ap-result-phone">
              <div className="ap-fan">
                {EXAMPLES.map((src, j) => (
                  <button
                    key={j}
                    type="button"
                    className={`ap-fan-card ap-fan-${fanSlot(j)}`}
                    onClick={() => setFront(j)}
                    aria-label={`Ver exemplo ${j + 1}`}
                  >
                    <img src={src} alt={j === 0 ? "Exemplo de post gerado pelo Postou" : ""} loading="lazy" />
                  </button>
                ))}
              </div>

            </div>
            <div className="ap-result-body">
              <span className="ap-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Entregue</span>
              <h3>E aí, está pronto.</h3>
              <p>Quando todas as imagens ficam prontas, o post aparece no app — e, se você quiser, chega direto no seu WhatsApp. É só revisar e publicar.</p>
              <div className="ap-chips">
                <span className="ap-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" /></svg>No app</span>
                <span className="ap-chip ap-chip--wa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" /></svg>No WhatsApp</span>
                <span className="ap-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>Imagem + legenda</span>
              </div>
            </div>
          </div>
        </div>
        <p className="ap-swipe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7 4 11l4 4" /><path d="M16 7l4 4-4 4" /><line x1="4" y1="11" x2="20" y2="11" /></svg>
          deslize pelos agentes
        </p>
      </div>

      <style>{`
        .ap { background: #1b1b1d; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 100px 0; overflow: hidden; }
        .ap-wrap { max-width: 1240px; margin: 0 auto; padding: 0 32px; }
        .ap-head { text-align: center; max-width: 660px; margin: 0 auto 48px; }
        .ap-head h2 { font-size: 44px; font-weight: 700; color: #fff; margin: 14px 0 14px; letter-spacing: -0.025em; line-height: 1.08; }
        .ap-head p { color: #a0a0a8; font-size: 17px; margin: 0; line-height: 1.5; text-wrap: pretty; }

        .ap-start {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          background: #202023; border: 1px solid rgba(255,255,255,0.07); border-radius: 22px;
          padding: 22px 26px; margin-bottom: 28px;
        }
        .ap-start-label { display: flex; flex-direction: column; gap: 4px; padding-right: 8px; }
        .ap-start-label strong { color: #fff; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
        .ap-start-opt {
          flex: 1; min-width: 240px; display: flex; gap: 14px; align-items: flex-start;
          background: #16161a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px 18px;
        }
        .ap-start-ico { flex: none; width: 40px; height: 40px; border-radius: 12px; background: rgba(65,105,225,0.14); color: #7da2ff; display: grid; place-items: center; }
        .ap-start-ico svg { width: 21px; height: 21px; }
        .ap-start-t { color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 2px; }
        .ap-start-d { color: #9a9aa2; font-size: 13.5px; line-height: 1.5; margin: 0; }
        .ap-hl { color: #7da2ff; font-weight: 600; }
        .ap-start-arrow { display: flex; align-items: center; gap: 10px; color: #6e6e7a; font-size: 13.5px; font-weight: 600; flex: none; }
        .ap-start-arrow svg { width: 20px; height: 20px; color: #4169e1; }

        .ap-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 28px; align-items: start; }
        .ap-card {
          position: relative; overflow: visible;
          background: #202023; border: 1px solid rgba(255,255,255,0.07); border-radius: 22px;
          transition: transform .4s cubic-bezier(.16,1,.3,1), border-color .35s, box-shadow .4s;
        }
        .ap-card:hover { transform: translateY(-4px); border-color: rgba(65,105,225,0.3); }
        .ap-card.open { border-color: rgba(65,105,225,0.45); box-shadow: 0 24px 54px -30px rgba(65,105,225,0.6); }
        .ap-card-head {
          appearance: none; background: none; border: none; font: inherit; color: inherit; cursor: pointer;
          width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center;
          padding: 14px 22px 18px;
        }
        .ap-toggle {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 14px;
          font-size: 12.5px; font-weight: 700; color: #7da2ff; letter-spacing: 0.01em;
        }
        .ap-chev { width: 15px; height: 15px; transition: transform .35s cubic-bezier(.16,1,.3,1); }
        .ap-card.open .ap-chev { transform: rotate(180deg); }
        .ap-more { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .42s cubic-bezier(.16,1,.3,1); }
        .ap-more > div { overflow: hidden; }
        .ap-card.open .ap-more { grid-template-rows: 1fr; }
        .ap-more > div > * { padding-left: 22px; padding-right: 22px; }
        .ap-more .ap-foot { padding-bottom: 20px; }

        .ap-stage { position: relative; width: 100%; height: 124px; overflow: visible; margin: 0 0 8px; display: flex; align-items: flex-end; justify-content: center; }
        .ap-stage::before { content: ""; position: absolute; left: 50%; top: 14%; width: 160px; height: 160px; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(65,105,225,0.38), transparent 66%); filter: blur(20px); border-radius: 50%; pointer-events: none; z-index: 0; }
        .ap-stage::after { content: ""; position: absolute; left: 50%; bottom: 0; width: 100px; height: 14px; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(65,105,225,0.5), transparent 72%); filter: blur(7px); pointer-events: none; z-index: 0; }
        .ap-img { position: relative; z-index: 1; max-height: 196px; max-width: 108%; width: auto; object-fit: contain; filter: drop-shadow(0 18px 30px rgba(0,0,0,0.5)); animation: apFloat 5s ease-in-out infinite; }
        @keyframes apFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .ap-row .ap-card:nth-child(2) .ap-img { animation-delay: -1.3s; }
        .ap-row .ap-card:nth-child(3) .ap-img { animation-delay: -2.6s; }
        .ap-row .ap-card:nth-child(4) .ap-img { animation-delay: -3.9s; }

        .ap-num { font-size: 12px; font-weight: 700; color: #6e6e7a; letter-spacing: 0.16em; font-variant-numeric: tabular-nums; }
        .ap-card:hover .ap-num { color: #7da2ff; }
        .ap-card h3 { font-size: 21px; font-weight: 700; color: #fff; margin: 4px 0 2px; letter-spacing: -0.02em; }
        .ap-role { font-size: 12px; font-weight: 700; color: #7da2ff; margin: 0 0 12px; font-family: ui-monospace, monospace; letter-spacing: 0.04em; }
        .ap-intro { font-size: 14.5px; color: #c4c4cc; line-height: 1.55; margin: 0 0 16px; }
        .ap-bullets { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 9px; }
        .ap-bullets li { font-size: 13.5px; color: #9a9aa2; line-height: 1.4; position: relative; padding-left: 16px; }
        .ap-bullets li::before { content: ""; position: absolute; left: 0; top: 7px; width: 5px; height: 5px; border-radius: 50%; background: #4169e1; }

        .ap-callout { display: flex; gap: 10px; background: rgba(65,105,225,0.08); padding: 12px 14px; margin: 0 0 16px; }
        .ap-callout svg { width: 18px; height: 18px; color: #7da2ff; flex: none; margin-top: 1px; }
        .ap-callout span { font-size: 13px; color: #bcc6e8; line-height: 1.45; }

        .ap-foot { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; gap: 8px; }
        .ap-foot-arr { color: #5a5a64; font-size: 13px; line-height: 1.5; flex: none; }
        .ap-foot p { font-size: 12.5px; color: #76767e; line-height: 1.5; margin: 0; }

        .ap-result { grid-column: 1 / -1; margin-top: 10px; display: flex; align-items: center; gap: 32px; background: linear-gradient(135deg, rgba(48,196,107,0.07), rgba(48,196,107,0.01)); border: 1px solid rgba(48,196,107,0.22); border-radius: 24px; padding: 28px 36px; }
        .ap-result-phone { position: relative; flex: none; }

        .ap-fan { position: relative; width: 228px; height: 206px; }
        .ap-fan-card {
          appearance: none; padding: 0; cursor: pointer;
          position: absolute; width: 126px; height: 158px; overflow: hidden;
          border-radius: 14px; border: 2px solid rgba(255,255,255,0.14);
          background: linear-gradient(150deg, #2f6bff, #4169e1 55%, #7b54ff);
          box-shadow: 0 20px 38px -14px rgba(0,0,0,0.75);
          transition: transform .45s cubic-bezier(.16,1,.3,1), left .45s cubic-bezier(.16,1,.3,1), top .45s cubic-bezier(.16,1,.3,1);
        }
        .ap-fan-l, .ap-fan-r { filter: brightness(0.82); }
        .ap-fan-c { filter: brightness(1); }
        .ap-fan-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ap-fan-c { left: 51px; top: 24px; transform: rotate(0deg); z-index: 3; }
        .ap-fan-l { left: 4px; top: 34px; transform: rotate(-9deg); z-index: 1; }
        .ap-fan-r { left: 98px; top: 34px; transform: rotate(9deg); z-index: 2; }
        .ap-result:hover .ap-fan-c { transform: translateY(-8px) rotate(0deg); }
        .ap-result:hover .ap-fan-l { left: -10px; transform: rotate(-13deg); }
        .ap-result:hover .ap-fan-r { left: 112px; transform: rotate(13deg); }

        .ap-phone { position: relative; width: 104px; height: 180px; border-radius: 18px; background: #0e0e10; border: 2px solid rgba(255,255,255,0.14); padding: 10px 9px; display: flex; flex-direction: column; gap: 8px; }
        .ap-phone-top { width: 30px; height: 4px; border-radius: 3px; background: rgba(255,255,255,0.18); margin: 0 auto 1px; }
        .ap-phone-art { flex: 1; border-radius: 9px; background: linear-gradient(150deg, #2f6bff, #4169e1 55%, #7b54ff); }
        .ap-phone-cap { display: flex; flex-direction: column; gap: 4px; }
        .ap-phone-cap span { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.16); }
        .ap-phone-cap span:last-child { width: 62%; }
        .ap-phone-wa { position: absolute; right: -2px; bottom: 6px; width: 38px; height: 38px; border-radius: 12px; background: #25D366; color: #0b3d1f; display: grid; place-items: center; box-shadow: 0 8px 22px -6px rgba(37,211,102,0.7); z-index: 4; }
        .ap-phone-wa svg { width: 20px; height: 20px; }

        .ap-result-body { min-width: 0; }
        .ap-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(48,196,107,0.16); color: #4fe08f; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; margin-bottom: 14px; }
        .ap-badge svg { width: 14px; height: 14px; }
        .ap-result-body h3 { font-size: 30px; font-weight: 700; color: #fff; margin: 0 0 10px; letter-spacing: -0.025em; }
        .ap-result-body > p { font-size: 16px; color: #b6b6be; line-height: 1.6; margin: 0 0 20px; max-width: 620px; }
        .ap-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .ap-chip { display: inline-flex; align-items: center; gap: 8px; background: #16161a; border: 1px solid rgba(255,255,255,0.08); color: #c4c4cc; font-size: 13.5px; font-weight: 600; padding: 9px 14px; border-radius: 12px; }
        .ap-chip svg { width: 16px; height: 16px; color: #7da2ff; }
        .ap-chip--wa svg { color: #4fe08f; }

        @media (prefers-reduced-motion: reduce) { .ap-img, .ap-phone { animation: none; } }

        .ap-swipe { display: none; }

        @media (max-width: 1080px) { .ap-row { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 900px) {.ap-card, .ap-result {max-width: 320px; margin: 0 auto;} .ap-result}
        @media (max-width: 900px) {
          .ap { padding: 72px 0; }
          .ap-wrap { padding: 0 20px; }
          .ap-head h2 { font-size: 32px; }
          .ap-row {
            display: flex; grid-template-columns: none; align-items: stretch; gap: 14px;
            overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; padding: 62px 20px 16px; margin: 0 -20px 8px;
          }
          .ap-row::-webkit-scrollbar { display: none; }
          .ap-card { flex: 0 0 86%; scroll-snap-align: center; scroll-snap-stop: always; }
          .ap-card:hover { transform: none; }
          .ap-card.open { box-shadow: none; border-color: rgba(255,255,255,0.07); }
          .ap-img { max-height: 180px; }
          /* No mobile (1 card por vez) mostra tudo — sem acordeão, sem vão cinza */
          .ap-more { grid-template-rows: 1fr; }
          .ap-toggle { display: none; }
          .ap-swipe {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            color: #6e6e7a; font-size: 13px; font-weight: 600; margin: 0 0 28px;
          }
          .ap-swipe svg { width: 18px; height: 18px; color: #4169e1; }
          .ap-start { flex-direction: column; align-items: stretch; }
          .ap-start-arrow { justify-content: center; }
          .ap-result {
            flex: 0 0 86%; scroll-snap-align: center; scroll-snap-stop: always; margin-top: 0;
            flex-direction: column; text-align: center; padding: 26px 22px;
          }
          .ap-result-body > p { margin-left: auto; margin-right: auto; font-size: 15px; }
          .ap-chips { justify-content: center; }
          .ap-result-body h3 { font-size: 26px; }
        }
      `}</style>
    </section>
  );
}
