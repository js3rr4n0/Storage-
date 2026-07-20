import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta ANTHROPIC_API_KEY. Agrega la variable de entorno en Vercel o en .env.local.",
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

  const client = new Anthropic({ apiKey });

  const prompt = `Eres un asesor de negocio para una tienda de figuras de anime en El Salvador.
Con base en estos datos de ventas e inventario (formato JSON), dame un analisis breve y accionable en espanol:
1. Que figuras/animes/marcas debo traer mas (mas vendidas y tendencias).
2. Que no me conviene traer (menos vendidas / estancado).
3. Analisis por categoria: waifus (femeninas), husbandos (masculinos) u otros: cual vende mas y que recomiendas.
4. 3 recomendaciones concretas para aumentar ventas.
Se directo y usa vinetas. No inventes datos que no esten aqui.

DATOS:
${JSON.stringify(summary, null, 2)}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text =
      textBlock && "text" in textBlock ? textBlock.text : "Sin respuesta.";
    return NextResponse.json({ analysis: text });
  } catch (e: any) {
    console.error("analyze error", e);
    return NextResponse.json(
      { error: e?.message || "Error al analizar" },
      { status: 500 }
    );
  }
}
