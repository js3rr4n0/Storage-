import { NextResponse } from "next/server";
import {
  sql,
  hasDB,
  ensureSchema,
  rowToFigure,
  rowToClient,
  rowToOrder,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDB || !sql) {
    return NextResponse.json(
      {
        error:
          "Falta DATABASE_URL. Conecta Neon en Vercel (Storage -> Neon) o agrega la variable de entorno.",
      },
      { status: 500 }
    );
  }
  try {
    await ensureSchema();
    const [figs, clients, orders] = await Promise.all([
      sql`SELECT * FROM figures ORDER BY name ASC`,
      sql`SELECT * FROM clients ORDER BY name ASC`,
      sql`SELECT * FROM orders ORDER BY created_at DESC`,
    ]);
    return NextResponse.json({
      figures: (figs as any[]).map(rowToFigure),
      clients: (clients as any[]).map(rowToClient),
      orders: (orders as any[]).map(rowToOrder),
    });
  } catch (e: any) {
    console.error("state error", e);
    return NextResponse.json(
      { error: e?.message || "Error al leer la base de datos" },
      { status: 500 }
    );
  }
}
