// Tom de voz — descritores ricos injetados nos prompts de copy. Mandar só a
// palavra ("próximo") dá pouco pro modelo; o descritor diz, em concreto,
// pronome/formalidade/emoji/ritmo.
//
// ⚠️ ESPELHADO em src/lib/tone.ts (runtime Node não compartilha módulo com Deno).
// Se mudar aqui, mude lá.

export const TONE_GUIDES: Record<string, string> = {
  institucional: "Formal e confiável. Use 'nós' ou 3ª pessoa, frases completas e vocabulário sóbrio. Sem gírias nem emojis. Passa seriedade e autoridade.",
  "próximo": "Como quem conversa com um amigo. Trate por 'você', frases curtas, calor humano e linguagem simples. Emojis com moderação.",
  "descontraído": "Leve e bem-humorado. Gírias leves e emojis são bem-vindos, com uma pitada de humor — sem forçar. Informal.",
  "acadêmico": "Didático e preciso. Explica com clareza e usa termos técnicos quando necessário (definindo-os). Pouco ou nenhum emoji.",
  inspirador: "Motivacional e aspiracional. Frases de impacto, foco em transformação e propósito. Caloroso e encorajador.",
  divertido: "Divertido e enérgico. Bastante leveza, trocadilhos e emojis, tom de brincadeira — entretém sem perder a mensagem.",
  premium: "Sofisticado e elegante. Menos é mais: vocabulário refinado, frases enxutas, zero gíria e quase nenhum emoji. Transmite exclusividade.",
  "empático": "Acolhedor e empático. Reconhece o sentimento do público, fala com gentileza e cuidado, sem pressão. Humano e tranquilizador.",
};

// Descritor pra injetar no prompt: "<tom> — <direção>". Tom desconhecido
// (valor antigo/custom) passa direto; vazio vira "neutro".
export function toneGuide(key?: string | null): string {
  if (!key) return "neutro";
  const g = TONE_GUIDES[key];
  return g ? `${key} — ${g}` : key;
}
