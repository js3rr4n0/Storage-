import { NextRequest, NextResponse } from "next/server";
import { BRANDS, SIZES, CATEGORIES } from "@/lib/constants";
import { generateContent } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const SIZE_KEYS = SIZES.map((s) => s.key);
const CAT_KEYS = CATEGORIES.map((c) => c.key);

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta GEMINI_API_KEY. Consigue una clave gratis en https://aistudio.google.com/apikey y agregala en Vercel (Settings -> Environment Variables).",
      },
      { status: 500 }
    );
  }

  let body: { image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const { image, mediaType } = body;
  if (!image) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  const prompt = `Eres un experto en figuras de anime (scale figures, Nendoroids, prize figures, etc.).
Analiza la foto de la figura y responde en espanol.
- "brand": la marca/fabricante mas probable. Si no estas seguro usa "Otra marca". Si parece bootleg usa "Bootleg / Sin marca".
- "size": estima el tipo/tamano (llavero, nendoroid, prize, escala, grande).
- "category": "waifu" si el personaje es femenino, "husbando" si es masculino, "otro" para mecha/criatura.
- "confidence": tu confianza real de 0 a 1. Si la imagen no es una figura, ponlo bajo y explica en "notes".`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      name: { type: "STRING" },
      character: { type: "STRING" },
      anime: { type: "STRING" },
      brand: { type: "STRING", enum: BRANDS },
      series: { type: "STRING" },
      size: { type: "STRING", enum: SIZE_KEYS },
      category: { type: "STRING", enum: CAT_KEYS },
      confidence: { type: "NUMBER" },
      notes: { type: "STRING" },
    },
    required: [
      "name",
      "character",
      "anime",
      "brand",
      "series",
      "size",
      "category",
      "confidence",
    ],
  };

  const result = await generateContent(apiKey, {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType || "image/jpeg", data: image } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!result.ok) {
    const msg = result.overloaded
      ? "La IA esta saturada en este momento. Espera unos segundos y toca la foto de nuevo."
      : result.error || "Error al identificar la figura";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  try {
    let text = (result.text || "{}").trim();
    text = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "La IA respondio en un formato inesperado. Intenta de nuevo." },
      { status: 502 }
    );
  }
}
