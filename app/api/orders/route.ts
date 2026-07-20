import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Order } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasDB || !sql) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const o = (await req.json()) as Order;
    await sql`
      INSERT INTO orders
        (id, client_id, client_name, figure_id, figure_name, quantity,
         unit_price, guia, status, created_at)
      VALUES
        (${o.id}, ${o.clientId}, ${o.clientName}, ${o.figureId ?? null},
         ${o.figureName}, ${o.quantity}, ${o.unitPrice}, ${o.guia},
         ${o.status}, ${o.createdAt})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("orders POST", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
