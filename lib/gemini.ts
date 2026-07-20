// Llama a Gemini con reintentos y respaldo entre modelos.
// Si el modelo principal esta saturado (alta demanda / 503 / 429), prueba
// automaticamente con otros modelos que funcionan con la capa gratis.

const FALLBACKS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GeminiResult {
  ok: boolean;
  text?: string;
  model?: string;
  error?: string;
  overloaded?: boolean;
}

export async function generateContent(
  apiKey: string,
  body: unknown
): Promise<GeminiResult> {
  const primary = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const models = Array.from(new Set([primary, ...FALLBACKS]));

  let lastErr = "No se pudo contactar la IA";
  let sawOverload = false;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const json: any = await res.json();

        if (res.ok) {
          const text: string =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return { ok: true, text, model };
        }

        lastErr = json?.error?.message || `Error ${res.status}`;
        const overloaded =
          res.status === 429 ||
          res.status === 500 ||
          res.status === 503 ||
          /overload|high demand|unavailable|try again|resource has been exhausted|rate/i.test(
            lastErr
          );
        if (overloaded) sawOverload = true;
        // Si el error no es de saturacion (ej. clave invalida), no tiene
        // sentido probar otros modelos: devolvemos de una.
        if (!overloaded) return { ok: false, error: lastErr };
        // Saturado: espera corta y reintenta / pasa al siguiente modelo.
        if (attempt === 0) await sleep(600);
      } catch (e: any) {
        lastErr = e?.message || "Error de red";
        await sleep(400);
      }
    }
  }

  return { ok: false, error: lastErr, overloaded: sawOverload };
}
