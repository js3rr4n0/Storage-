import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Candidatos con vision + probable capa gratis, en orden de preferencia.
const CANDIDATES = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash-lite",
];

async function probe(model: string, apiKey: string) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "di 'ok'" }] }],
        }),
      }
    );
    const json = await res.json();
    if (res.ok) {
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { model, ok: true, sample: text.slice(0, 40) };
    }
    return { model, ok: false, error: json?.error?.message?.slice(0, 120) };
  } catch (e: any) {
    return { model, ok: false, error: e?.message };
  }
}

// Ruta temporal de diagnostico: prueba cual modelo funciona con tu clave.
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta GEMINI_API_KEY" }, { status: 500 });
  }
  const results = [];
  for (const m of CANDIDATES) {
    results.push(await probe(m, apiKey));
  }
  const working = results.filter((r) => r.ok).map((r) => r.model);
  return NextResponse.json({ working, results });
}
