import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta GEMINI_API_KEY. Consigue una clave gratis en https://aistudio.google.com/apikey y agregala en Vercel.",
      },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const { summary } = body;
  if (!summary) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const prompt = `Eres un asesor de negocio para una tienda de figuras de anime en El Salvador.
Con base en estos datos de ventas e inventario (JSON), da un analisis breve y accionable en espanol:
1. Que figuras/animes/marcas traer mas (mas vendidas y tendencias).
2. Que no conviene traer (menos vendidas / estancado).
3. Analisis por categoria: waifus (femeninas), husbandos (masculinos) u otros: cual vende mas y que recomiendas.
4. 3 recomendaciones concretas para aumentar ventas.
Se directo, usa vinetas. No inventes datos que no esten aqui.

DATOS:
${JSON.stringify(summary, null, 2)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error?.message || "Error de Gemini";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    const text: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
    return NextResponse.json({ analysis: text });
  } catch (e: any) {
    console.error("analyze error", e);
    return NextResponse.json(
      { error: e?.message || "Error al analizar" },
      { status: 500 }
    );
  }
}
