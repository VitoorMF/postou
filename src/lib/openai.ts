import OpenAI from "openai";

// Instancia sob demanda: criar no topo do módulo quebra o `next build` sem OPENAI_API_KEY
// (o Next avalia as rotas ao coletar page data).
let client: OpenAI | null = null;

export function openai() {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}
