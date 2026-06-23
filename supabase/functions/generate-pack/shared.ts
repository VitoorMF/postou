// Infra compartilhada do pipeline: clientes, modelo de copy, tipos e helpers
// de baixo nível (embedding, conversão/upload de imagem, datas comemorativas).
// Tudo que mais de um "agente" usa mora aqui.

import OpenAI, { toFile } from "npm:openai";
import { createClient } from "npm:@supabase/supabase-js";
import { decodeBase64 } from "jsr:@std/encoding/base64";

export { toFile };

export const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Modelo da COPY (planner + conteúdo + legenda — o que o cliente lê).
// Ponto único de troca: suba aqui pra elevar a qualidade da copy. Texto é barato perto da imagem.
export const COPY_MODEL = "gpt-4.1";

// Janela em que um update temporal ainda conta como "novidade".
export const FRESHNESS_DAYS = 7;

export type Mode = "evento" | "evergreen";

export type UpdateRow = {
  id: string;
  category: string;
  content: string;
  created_at: string;
  photo_urls: string[] | null;
};

// ─── Datas comemorativas ──────────────────────────────────────────────────────

// Datas comemorativas universais. Móveis (Carnaval, Páscoa, Mães, Pais, Black Friday)
// guardadas com a data real do ano — RE-CURAR 1×/ano (atualizar para o ano vigente).
export const COMMEMORATIVE_DATES: { date: string; name: string; leadDays: number }[] = [
  { date: "2026-01-01", name: "Ano Novo", leadDays: 3 },
  { date: "2026-02-17", name: "Carnaval", leadDays: 5 },
  { date: "2026-03-15", name: "Dia do Consumidor", leadDays: 3 },
  { date: "2026-04-05", name: "Páscoa", leadDays: 7 },
  { date: "2026-05-10", name: "Dia das Mães", leadDays: 7 },
  { date: "2026-06-12", name: "Dia dos Namorados", leadDays: 7 },
  { date: "2026-06-24", name: "São João / Festas Juninas", leadDays: 7 },
  { date: "2026-08-09", name: "Dia dos Pais", leadDays: 7 },
  { date: "2026-09-15", name: "Dia do Cliente", leadDays: 3 },
  { date: "2026-10-12", name: "Dia das Crianças", leadDays: 5 },
  { date: "2026-11-27", name: "Black Friday", leadDays: 7 },
  { date: "2026-12-25", name: "Natal", leadDays: 7 },
];

// Retorna uma dica de data comemorativa próxima (dentro da antecedência), ou "".
export function upcomingCommemorativeHint(): string {
  const sp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const today = new Date(sp.getFullYear(), sp.getMonth(), sp.getDate());
  for (const d of COMMEMORATIVE_DATES) {
    const [y, m, dd] = d.date.split("-").map(Number);
    const target = new Date(y, m - 1, dd);
    const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (days >= 0 && days <= d.leadDays) {
      return days === 0
        ? `Hoje é ${d.name}. Se combinar com a marca, use como tema do post — a não ser que haja um acontecimento mais relevante nos updates.`
        : `Faltam ${days} dia(s) para ${d.name}. Considere usar como tema, a não ser que haja um acontecimento mais relevante nos updates.`;
    }
  }
  return "";
}

// ─── Embedding ──────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return res.data[0].embedding;
}

// ─── Image helpers ────────────────────────────────────────────────────────────

// Converte uma imagem (data URL base64 OU url http) num File pro images.edit.
export async function imageToFile(data: string, name: string, type: string) {
  let buffer: ArrayBuffer;
  if (data.startsWith("data:")) {
    buffer = decodeBase64(data.split(",")[1]).buffer;
  } else {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  }
  return toFile(buffer, name, { type });
}

export async function uploadImage(data: string, path: string): Promise<string | null> {
  let buffer: ArrayBuffer;
  if (data.startsWith("data:")) {
    const base64 = data.split(",")[1];
    buffer = decodeBase64(base64).buffer;
  } else {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  }

  const { error } = await supabaseAdmin.storage
    .from("packs")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) { console.error("Erro upload:", error); return null; }

  const { data: urlData } = supabaseAdmin.storage.from("packs").getPublicUrl(path);
  return urlData.publicUrl;
}
