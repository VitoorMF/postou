// ARQUÉTIPOS — a ESTRUTURA do conteúdo. Antes o LLM escolhia o arquétipo a cada
// geração e viciava no mais óbvio (saíam vários "Mito × Verdade" seguidos). Agora
// a escolha é por CÓDIGO: rotação ponderada que evita os últimos usados. Isso
// garante variedade de formato sem depender do humor do modelo.
//
// Catálogos separados por mídia: imagem única (post/story) precisa de arquétipos
// que se resolvem numa imagem só; carrossel precisa de arquétipos que rendem uma
// SÉRIE de slides.

export type Archetype = { key: string; label: string; instruction: string };

// Post e Story: UMA imagem. Nada de passo a passo / lista longa (vira capa vazia).
export const SINGLE_ARCHETYPES: Archetype[] = [
  {
    key: "dica_unica",
    label: "Dica única",
    instruction: "UMA dica forte e completa — uma única ideia acionável, bem desenvolvida. NÃO é uma lista.",
  },
  {
    key: "mito_verdade",
    label: "Mito × Verdade",
    instruction: "Derrube UMA crença comum do público: apresente o mito e a verdade que o corrige.",
  },
  {
    key: "reflexao",
    label: "Reflexão / posicionamento",
    instruction: "Uma reflexão ou posicionamento: a visão/opinião da marca sobre um tema da área, que provoca o público a pensar.",
  },
  {
    key: "bastidor",
    label: "Bastidor / rotina",
    instruction: "Um bastidor que humaniza a marca: mostra um detalhe real do processo, da rotina ou do cuidado por trás do trabalho.",
  },
  {
    key: "pergunta",
    label: "Pergunta provocativa",
    instruction: "Uma pergunta que toca uma dor ou desejo real do público e abre conversa. A arte gira em torno dessa única pergunta.",
  },
  {
    key: "comparacao",
    label: "Comparação",
    instruction: "Uma comparação simples entre dois caminhos ou escolhas (isto × aquilo), fechando com o que a marca recomenda. Sem virar lista longa.",
  },
];

// Carrossel: SÉRIE de slides (1 ponto por slide).
export const CARROSSEL_ARCHETYPES: Archetype[] = [
  {
    key: "explicador",
    label: "Explicador",
    instruction: "Explica um conceito/termo da área em série: a capa apresenta o 'o que é X', os slides de corpo destrincham as partes, o CTA fecha.",
  },
  {
    key: "mito_verdade",
    label: "Mito × Verdade",
    instruction: "Derruba crenças comuns em série: cada slide de corpo traz UM mito e a verdade que o corrige.",
  },
  {
    key: "duvidas_frequentes",
    label: "Dúvidas frequentes",
    instruction: "Responde perguntas reais do público: cada slide de corpo é UMA pergunta com resposta curta e direta.",
  },
  {
    key: "passo_a_passo",
    label: "Passo a passo",
    instruction: "Um passo a passo prático: cada slide de corpo é UM passo, na ordem certa.",
  },
  {
    key: "erros_comuns",
    label: "Erros comuns",
    instruction: "Erros comuns que o público comete: cada slide de corpo traz UM erro e como evitá-lo.",
  },
  {
    key: "lista",
    label: "Lista temática",
    instruction: "Uma lista temática (opções, sinais, dicas): cada slide de corpo entrega UM item.",
  },
];

// Escolhe o próximo arquétipo por rotação ponderada dentro do catálogo do formato.
// recentKeys = arquétipos dos últimos packs, do mais recente (índice 0) ao mais antigo.
// Pesos: nunca-usado-recente favorito (3), o último quase nunca (0.25), os do meio normais (1).
export function pickArchetype(type: string, recentKeys: string[]): Archetype {
  const catalog = type === "carrossel" ? CARROSSEL_ARCHETYPES : SINGLE_ARCHETYPES;

  const weights = catalog.map((a) => {
    const idx = recentKeys.indexOf(a.key);
    if (idx === -1) return 3;     // não apareceu nos recentes → favorito
    if (idx === 0) return 0.25;   // foi o último usado → quase nunca repete
    return 1;                     // usado recentemente, mas não o último
  });

  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < catalog.length; i++) {
    r -= weights[i];
    if (r <= 0) return catalog[i];
  }
  return catalog[catalog.length - 1];
}
