import { neon } from "@neondatabase/serverless";
import { Figure, Client, Order } from "./types";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const hasDB = !!connectionString;

// Cliente SQL (usa la variable DATABASE_URL de Neon).
export const sql = connectionString ? neon(connectionString) : null;

let schemaReady = false;

/** Crea las tablas si no existen (idempotente). */
export async function ensureSchema(): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL no configurada");
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS figures (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      character_name TEXT NOT NULL DEFAULT '',
      anime TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT '',
      series TEXT NOT NULL DEFAULT '',
      size TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'otro',
      cost NUMERIC NOT NULL DEFAULT 0,
      price NUMERIC NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      notes TEXT,
      created_at BIGINT NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      municipality TEXT NOT NULL DEFAULT '',
      created_at BIGINT NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      figure_id TEXT,
      figure_name TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC NOT NULL DEFAULT 0,
      guia TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pendiente',
      created_at BIGINT NOT NULL
    )`;
  schemaReady = true;
}

// --- Mappers (Postgres -> tipos de la app) ---
export function rowToFigure(r: any): Figure {
  return {
    id: r.id,
    name: r.name ?? "",
    character: r.character_name ?? "",
    anime: r.anime ?? "",
    brand: r.brand ?? "",
    series: r.series ?? "",
    size: r.size ?? "",
    category: r.category ?? "otro",
    cost: Number(r.cost),
    price: Number(r.price),
    quantity: Number(r.quantity),
    image: r.image ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: Number(r.created_at),
  };
}

export function rowToClient(r: any): Client {
  return {
    id: r.id,
    name: r.name ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    department: r.department ?? "",
    municipality: r.municipality ?? "",
    createdAt: Number(r.created_at),
  };
}

export function rowToOrder(r: any): Order {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name ?? "",
    figureId: r.figure_id ?? undefined,
    figureName: r.figure_name ?? "",
    quantity: Number(r.quantity),
    unitPrice: Number(r.unit_price),
    guia: r.guia ?? "",
    status: r.status,
    createdAt: Number(r.created_at),
  };
}
