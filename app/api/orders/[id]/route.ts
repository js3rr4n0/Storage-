import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Order } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasDB || !sql) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const { id } = await params;
    const o = (await req.json()) as Order;
    await sql`
      UPDATE orders SET
        client_id = ${o.clientId},
        client_name = ${o.clientName},
        figure_id = ${o.figureId ?? null},
        figure_name = ${o.figureName},
        quantity = ${o.quantity},
        unit_price = ${o.unitPrice},
        guia = ${o.guia},
        status = ${o.status}
      WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("orders PATCH", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasDB || !sql) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const { id } = await params;
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("orders DELETE", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
