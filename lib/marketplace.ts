// Export del inventario en el formato de la plantilla «Importar productos»
// del marketplace (hoja «Productos», encabezados exactos en la fila 1).
import { Figure } from "./types";
import { SIZES } from "./constants";

export const MARKETPLACE_HEADERS = [
  "Título",
  "Descripción",
  "Categoría",
  "Marca",
  "Precio",
  "Precio antes de oferta",
  "Stock",
  "SKU",
  "Tipo de opción",
  "Opción",
];

// Categoría del marketplace donde van las figuras (debe ser una de su lista).
export const MARKETPLACE_CATEGORY = "Juguetes y Juegos";

// Urbby cobra 5% de comisión + 13% de IVA sobre esa comisión (5.65% del precio).
// El precio publicado se sube para que, después del descuento, te quede
// al menos tu precio de venta de la app.
export const URBBY_COMMISSION = 0.05;
export const URBBY_IVA = 0.13;
const URBBY_FEE = URBBY_COMMISSION * (1 + URBBY_IVA); // 0.0565

/** Lo que Urbby te deposita por una venta a `listed`. */
export function urbbyNet(listed: number): number {
  const commission = Math.round(listed * URBBY_COMMISSION * 100) / 100;
  const iva = Math.round(commission * URBBY_IVA * 100) / 100;
  return Math.round((listed - commission - iva) * 100) / 100;
}

/** Precio a publicar en Urbby: cubre la comisión y se redondea al dólar entero de arriba. */
export function urbbyPrice(target: number): number {
  let listed = Math.ceil(target / (1 - URBBY_FEE));
  while (urbbyNet(listed) < target) listed += 1;
  return listed;
}

const TITLE_MIN = 8;
const TITLE_MAX = 120;
const DESC_MIN = 20;

const clean = (s?: string) => (s || "").replace(/\s+/g, " ").trim();
const has = (hay: string, needle: string) =>
  !!needle && hay.toLowerCase().includes(needle.toLowerCase());

function buildTitle(f: Figure): string {
  let t = clean(f.name) || clean(f.character) || "Figura de anime";
  const character = clean(f.character);
  const anime = clean(f.anime);
  if (character && has(character, t)) t = character;
  else if (character && !has(t, character)) t = `${character} ${t}`;
  if (anime && !has(t, anime)) t = `${t} - ${anime}`;
  if (!/figura/i.test(t) && t.length < 40) t = `Figura ${t}`;
  if (t.length < TITLE_MIN) t = `${t} - Figura de anime`;
  if (t.length > TITLE_MAX) t = t.slice(0, TITLE_MAX - 1).trimEnd() + "…";
  return t;
}

function buildDescription(f: Figure): string {
  const size = SIZES.find((s) => s.key === f.size)?.label;
  const parts: string[] = [];
  const character = clean(f.character);
  const anime = clean(f.anime);
  if (character && anime) parts.push(`Figura de ${character} de ${anime}.`);
  else if (character) parts.push(`Figura de ${character}.`);
  else if (anime) parts.push(`Figura de ${anime}.`);
  else parts.push(`Figura de anime ${clean(f.name)}.`);
  if (clean(f.brand) && !/sin marca|otra marca/i.test(f.brand)) parts.push(`Marca: ${clean(f.brand)}.`);
  if (clean(f.series)) parts.push(`Línea: ${clean(f.series)}.`);
  if (size) parts.push(`Tamaño: ${size}.`);
  if (clean(f.notes)) parts.push(clean(f.notes));
  let d = parts.join(" ");
  if (d.length < DESC_MIN) d += " Original, nueva y lista para coleccionar.";
  return d;
}

function brandFor(f: Figure): string {
  const b = clean(f.brand);
  if (!b || /otra marca/i.test(b)) return "";
  if (/bootleg|sin marca/i.test(b)) return "Sin marca";
  return b;
}

function skuFor(f: Figure): string {
  return "FIG-" + f.id.slice(-8).toUpperCase();
}

/** Filas (sin encabezado) listas para la hoja «Productos». Solo figuras con stock. */
export function marketplaceRows(figures: Figure[]): (string | number)[][] {
  return figures
    .filter((f) => Number(f.quantity) > 0 && Number(f.price) > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((f) => [
      buildTitle(f),
      buildDescription(f),
      MARKETPLACE_CATEGORY,
      brandFor(f),
      urbbyPrice(Number(f.price)),
      "",
      Math.floor(Number(f.quantity)),
      skuFor(f),
      "",
      "",
    ]);
}
