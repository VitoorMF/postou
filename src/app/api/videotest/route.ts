import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import path from "path";

export const maxDuration = 300; // 5 min

const PROMPT = `
Create a vertical 9:16 premium Instagram Reel, 12 seconds long.

Theme: achievements and updates from a Brazilian agribusiness consultant.

Style:
Modern premium agribusiness advertising, warm golden sunset, beige, black and olive green tones, cinematic lighting, realistic camera, social-first editing, quick 1–2 second cuts, elegant commercial look, premium Instagram/TikTok ad style.

Important:
Do not generate any readable text, subtitles, captions, logos, or written words inside the video. Leave clean space for text overlays to be added later in editing.

Scene 1 (0–2s):
Cinematic drone shot over a modern cattle farm at golden hour, cattle in the background, dust particles in the air, slow forward camera movement.

Scene 2 (2–4s):
A young female agribusiness consultant walking confidently in the field near cattle, smiling, modern rural business outfit, soft wind, cinematic close-up.

Scene 3 (4–6s):
Professional handshake between rural producers and a consulting partner, quick shots of documents, laptop, financial charts and a premium meeting table.

Scene 4 (6–8s):
Modern agribusiness conference stage with warm lights, the consultant speaking to a large audience.

Scene 5 (8–10s):
Fast premium montage: coffee being served, boots walking on rural soil, laptop with charts, drone over crops, confident smile.

Scene 6 (10–12s):
Final cinematic shot of the consultant looking at the farm during sunset, inspiring and premium, leaving empty space in the upper center for a future logo/text overlay.

Editing direction:
Fast modern Instagram Reel pacing, smooth motion blur, cinematic speed ramps, elegant transitions, premium realistic look, no cartoon style, no AI-looking distortions.
`;

export async function POST() {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY não configurada" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: PROMPT,
      config: { aspectRatio: "9:16" },
    });

    while (!operation.done) {
      console.log("Aguardando geração de vídeo…");
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const generated = operation.response?.generatedVideos?.[0];
    if (!generated?.video) {
      return NextResponse.json({ error: "Nenhum vídeo gerado" }, { status: 500 });
    }

    const filename = `test-${Date.now()}.mp4`;
    const downloadPath = path.join(process.cwd(), "public", "videos", filename);
    await ai.files.download({ file: generated.video, downloadPath });

    return NextResponse.json({ url: `/videos/${filename}` });
  } catch (err) {
    console.error("Erro Veo:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
