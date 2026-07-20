import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Figure } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasDB || !sql) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const f = (await req.json()) as Figure;
    await sql`
      INSERT INTO figures
        (id, name, character_name, anime, brand, series, size, category,
         cost, price, quantity, image, notes, created_at)
      VALUES
        (${f.id}, ${f.name}, ${f.character}, ${f.anime}, ${f.brand}, ${f.series},
         ${f.size}, ${f.category}, ${f.cost}, ${f.price}, ${f.quantity},
         ${f.image ?? null}, ${f.notes ?? null}, ${f.createdAt})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("figures POST", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
