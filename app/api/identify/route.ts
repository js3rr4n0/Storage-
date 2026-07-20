import { NextRequest, NextResponse } from "next/server";
import { BRANDS, SIZES, CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const SIZE_KEYS = SIZES.map((s) => s.key);
const CAT_KEYS = CATEGORIES.map((c) => c.key);
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mediaType || "image/jpeg",
                  data: image,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error?.message || "Error de Gemini";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    let text: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("identify error", e);
    return NextResponse.json(
      { error: e?.message || "Error al identificar la figura" },
      { status: 500 }
    );
  }
}
