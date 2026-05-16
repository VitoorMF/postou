import { NextResponse } from "next/server";
import { sendText, sendImage } from "@/lib/zapi";

export async function POST(request: Request) {
  try {
    const { phone, message, imageUrl } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "phone obrigatório" }, { status: 400 });
    }

    let result;
    if (imageUrl) {
      result = await sendImage(phone, imageUrl, message);
    } else {
      result = await sendText(phone, message ?? "Teste do Postou via Z-API ✅");
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Erro Z-API test:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
