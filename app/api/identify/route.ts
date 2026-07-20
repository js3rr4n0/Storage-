import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BRANDS, SIZES, CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const SIZE_KEYS = SIZES.map((s) => s.key);
const CAT_KEYS = CATEGORIES.map((c) => c.key);

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta ANTHROPIC_API_KEY. Agrega la variable de entorno en Vercel (Settings -> Environment Variables) o en un archivo .env.local.",
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

  const client = new Anthropic({ apiKey });

  const prompt = `Eres un experto en figuras de anime (scale figures, Nendoroids, prize figures, etc.).
Analiza la foto de la figura y responde UNICAMENTE con un objeto JSON valido (sin texto extra, sin markdown, sin backticks) con esta forma exacta:
{
  "name": "nombre o edicion de la figura",
  "character": "nombre del personaje",
  "anime": "anime, juego o serie de origen",
  "brand": "una de: ${BRANDS.join(" | ")}",
  "series": "linea de producto (ej. Nendoroid, POP UP PARADE, Figuarts)",
  "size": "una de: ${SIZE_KEYS.join(" | ")}",
  "category": "una de: ${CAT_KEYS.join(" | ")}",
  "confidence": 0.0,
  "notes": "observacion breve"
}
Reglas:
- "brand": la marca/fabricante mas probable de la lista. Si no estas seguro usa "Otra marca". Si parece bootleg usa "Bootleg / Sin marca".
- "size": estima el tipo/tamano (llavero, nendoroid, prize, escala, grande).
- "category": "waifu" si el personaje es femenino, "husbando" si es masculino, "otro" para mecha/criatura.
- "confidence": tu confianza real de 0 a 1. Si la imagen no es una figura, ponlo bajo y explica en "notes".
Escribe los valores en espanol.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: (mediaType as any) || "image/jpeg",
                data: image,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    let raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    // Quita posibles fences de markdown y extrae el primer objeto JSON.
    raw = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("identify error", e);
    return NextResponse.json(
      { error: e?.message || "Error al identificar la figura" },
      { status: 500 }
    );
  }
}
