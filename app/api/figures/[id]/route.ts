import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Figure } from "@/lib/types";

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
    const f = (await req.json()) as Figure;
    await sql`
      UPDATE figures SET
        name = ${f.name},
        character_name = ${f.character},
        anime = ${f.anime},
        brand = ${f.brand},
        series = ${f.series},
        size = ${f.size},
        category = ${f.category},
        cost = ${f.cost},
        price = ${f.price},
        quantity = ${f.quantity},
        image = ${f.image ?? null},
        notes = ${f.notes ?? null}
      WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("figures PATCH", e);
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
    await sql`DELETE FROM figures WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("figures DELETE", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
