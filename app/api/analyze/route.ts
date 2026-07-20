import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const result = await generateContent(apiKey, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  if (!result.ok) {
    const msg = result.overloaded
      ? "La IA esta saturada en este momento. Espera unos segundos e intenta de nuevo."
      : result.error || "Error al analizar";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  return NextResponse.json({ analysis: result.text || "Sin respuesta." });
}
