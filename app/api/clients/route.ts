import { NextRequest, NextResponse } from "next/server";
import { sql, hasDB, ensureSchema } from "@/lib/db";
import { Client } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasDB || !sql) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 500 });
  }
  try {
    await ensureSchema();
    const c = (await req.json()) as Client;
    await sql`
      INSERT INTO clients
        (id, name, phone, address, department, municipality, created_at)
      VALUES
        (${c.id}, ${c.name}, ${c.phone}, ${c.address}, ${c.department},
         ${c.municipality}, ${c.createdAt})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("clients POST", e);
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
