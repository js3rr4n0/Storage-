// Configuracion de negocio (El Salvador usa USD)
export const BASE_COST = 12; // precio de costo por figura
export const MIN_PRICE = 25; // precio de venta minimo

// Multiplicadores de marca segun posicionamiento en el mercado de figuras de El Salvador.
// Puedes ajustarlos aqui cuando quieras.
export const BRAND_MULTIPLIERS: Record<string, number> = {
  "Good Smile Company": 2.6,
  "Max Factory": 2.5,
  Alter: 3.2,
  Kotobukiya: 2.6,
  Bandai: 2.4,
  Aniplex: 2.8,
  "Freeing": 3.0,
  Banpresto: 1.6,
  Sega: 1.6,
  Furyu: 1.6,
  Taito: 1.5,
  "Bootleg / Sin marca": 1.1,
  "Otra marca": 1.8,
};

export const BRANDS = Object.keys(BRAND_MULTIPLIERS);
export const DEFAULT_BRAND_MULTIPLIER = 1.8;

// Tamanos / tipo de figura y su multiplicador
export interface SizeOption {
  key: string;
  label: string;
  multiplier: number;
}

export const SIZES: SizeOption[] = [
  { key: "llavero", label: "Llavero / mini (<8cm)", multiplier: 0.8 },
  { key: "nendoroid", label: "Nendoroid / chibi (~10cm)", multiplier: 1.2 },
  { key: "prize", label: "Prize / estandar (16-21cm)", multiplier: 1.4 },
  { key: "escala", label: "Escala 1/8 - 1/7 (22-27cm)", multiplier: 2.0 },
  { key: "grande", label: "Grande 1/6 - 1/4 (>27cm)", multiplier: 2.8 },
];

export const SIZE_MULTIPLIERS: Record<string, number> = Object.fromEntries(
  SIZES.map((s) => [s.key, s.multiplier])
);
export const DEFAULT_SIZE_MULTIPLIER = 1.4;

export const CATEGORIES: { key: "waifu" | "husbando" | "otro"; label: string }[] = [
  { key: "waifu", label: "Waifu (femenino)" },
  { key: "husbando", label: "Husbando (masculino)" },
  { key: "otro", label: "Otro / mecha / criatura" },
];

// Colores validados (daltonismo + contraste) para los graficos de categoria.
export const CATEGORY_COLORS: Record<string, string> = {
  waifu: "#c04a6e",
  husbando: "#4a5fc4",
  otro: "#b5822f",
};

// Colores validados para composicion de dinero.
export const MONEY_COLORS = {
  cost: "#b5822f",
  profit: "#1f8f7a",
};

// Departamentos de El Salvador
export const DEPARTMENTS = [
  "Ahuachapan",
  "Santa Ana",
  "Sonsonate",
  "Chalatenango",
  "La Libertad",
  "San Salvador",
  "Cuscatlan",
  "La Paz",
  "Cabanas",
  "San Vicente",
  "Usulutan",
  "San Miguel",
  "Morazan",
  "La Union",
];

export const ORDER_STATUSES: { key: string; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "pagado", label: "Pagado" },
  { key: "enviado", label: "Enviado" },
  { key: "entregado", label: "Entregado" },
  { key: "cancelado", label: "Cancelado" },
];
