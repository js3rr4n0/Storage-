import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ruta temporal de diagnostico: lista los modelos de Gemini disponibles
// para tu clave y cuales soportan generateContent (vision/texto).
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta GEMINI_API_KEY" }, { status: 500 });
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`
    );
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error?.message || "Error" },
        { status: 500 }
      );
    }
    const models = (json.models || [])
      .filter((m: any) =>
        (m.supportedGenerationMethods || []).includes("generateContent")
      )
      .map((m: any) => m.name.replace("models/", ""));
    return NextResponse.json({ count: models.length, models });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
