import {
  BASE_COST,
  MIN_PRICE,
  BRAND_MULTIPLIERS,
  DEFAULT_BRAND_MULTIPLIER,
  SIZE_MULTIPLIERS,
  DEFAULT_SIZE_MULTIPLIER,
} from "./constants";

/**
 * Sugiere un precio de venta segun la marca, el tamano/modelo y el costo base.
 * - Costo base fijo (por defecto $12)
 * - Precio minimo $25
 * - Se redondea al multiplo de $5 mas cercano para precios "de tienda".
 */
export function suggestPrice(
  brand: string,
  size: string,
  cost: number = BASE_COST
): number {
  const brandMult = BRAND_MULTIPLIERS[brand] ?? DEFAULT_BRAND_MULTIPLIER;
  const sizeMult = SIZE_MULTIPLIERS[size] ?? DEFAULT_SIZE_MULTIPLIER;
  const raw = cost * brandMult * sizeMult;
  const rounded = Math.round(raw / 5) * 5;
  return Math.max(MIN_PRICE, rounded);
}

export function formatMoney(n: number): string {
  return "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
