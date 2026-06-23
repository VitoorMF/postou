"use client";

import { useState } from "react";

type Cat = "geral" | "conteudo" | "planos";

const FAQ_DATA: Record<Cat, { label: string; items: [string, string][] }> = {
  geral: {
    label: "Geral",
    items: [
      ["Preciso saber design ou escrever bem?", "Não. O Postou cuida do texto e da arte — você só dá o tema (ou nem isso). A IA escreve a legenda, monta os slides e aplica a sua identidade visual. Se quiser ajustar, é só editar antes de publicar."],
      ["O Postou posta sozinho no meu Instagram?", "O Postou gera o conteúdo pronto e entrega pra você (no app e no WhatsApp). A publicação fica no seu controle — você revisa e posta com um toque, ou agenda. Você nunca perde o controle do que vai pro ar."],
      ["Funciona para o meu tipo de negócio?", "Sim. O Postou foi pensado pra marcas e criadores brasileiros de dezenas de nichos — do agro à estética, de consultoria a food. Ele aprende o seu tom a partir do seu brand kit e das novidades que você manda."],
      ["Em quanto tempo recebo meu primeiro post?", "Em segundos. Assim que você termina o onboarding, o Postou já prepara o primeiro conteúdo. Depois, ele gera automaticamente nos dias e horário que você escolher."],
    ],
  },
  conteudo: {
    label: "Conteúdo",
    items: [
      ["E se eu não gostar do post?", "Você pode regenerar quantas vezes quiser dentro da sua cota, editar o texto na hora, ou trocar o formato (post, story, carrossel). O 👍/👎 em cada geração também ensina o modelo a acertar mais no seu gosto."],
      ["Qual a diferença entre geração automática e manual?", "A <b>automática</b> roda sozinha nos dias agendados, escolhendo tema e formato pra você. A <b>manual</b> é sob demanda: você abre o gerador, define tema e formato, e cria na hora. Cada plano tem sua cota de cada tipo."],
      ["Posso usar minhas próprias imagens?", "Pode. No gerador manual você anexa até 5 imagens e a IA usa como base da arte — sem distorcer a sua foto. No brand kit você também salva logo e fotos suas, que entram nas gerações automaticamente."],
      ["Dá pra fazer carrossel?", "Sim, nos planos Starter e Pro. O Postou monta capa, miolo e CTA já na sua identidade — é só revisar e publicar."],
    ],
  },
  planos: {
    label: "Planos",
    items: [
      ["Preciso de cartão para usar o plano grátis?", "Não. O plano Free é grátis pra sempre, sem cartão. Você só adiciona forma de pagamento se decidir assinar Starter ou Pro."],
      ["Posso cancelar quando quiser?", "Sim, em dois cliques, sem multa nem fidelidade. Você continua com acesso até o fim do período já pago. Há ainda 7 dias de reembolso sem perguntas."],
      ["O que acontece quando acaba minha cota?", "As gerações renovam no início de cada semana. Se precisar de mais antes disso, é só fazer upgrade — o novo limite vale na hora."],
    ],
  },
};

const ORDER: Cat[] = ["geral", "conteudo", "planos"];

export default function FAQ() {
  const [cat, setCat] = useState<Cat>("geral");

  return (
    <div className="faq-layout">
      <aside className="faq-nav">
        {ORDER.map((key) => (
          <button
            key={key}
            className={`faq-cat${cat === key ? " on" : ""}`}
            onClick={() => setCat(key)}
          >
            {FAQ_DATA[key].label}
            <span className="faq-cat-c">{FAQ_DATA[key].items.length}</span>
          </button>
        ))}
      </aside>

      {/* key={cat} re-monta a lista ao trocar de categoria → 1º item reabre */}
      <div className="faq-list" key={cat}>
        {FAQ_DATA[cat].items.map(([q, a], i) => (
          <details className="faq-item" key={i} open={i === 0}>
            <summary>
              {q}
              <span className="faq-ic">+</span>
            </summary>
            <p dangerouslySetInnerHTML={{ __html: a }} />
          </details>
        ))}
      </div>
    </div>
  );
}
