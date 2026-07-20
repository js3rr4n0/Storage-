import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Client } from "@/lib/types";

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
    const c = (await req.json()) as Client;
    await sql`
      UPDATE clients SET
        name = ${c.name},
        phone = ${c.phone},
        address = ${c.address},
        department = ${c.department},
        municipality = ${c.municipality}
      WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("clients PATCH", e);
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
    // Borra tambien los pedidos del cliente.
    await sql`DELETE FROM orders WHERE client_id = ${id}`;
    await sql`DELETE FROM clients WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("clients DELETE", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
