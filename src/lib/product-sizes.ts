export type MeasurementUnit = "inches" | "cm";

const MEASUREMENT_SIZE_RE = /^(\d+(?:\.\d+)?)\s*(inches|cm)$/i;

export function formatMeasurementSize(value: number, unit: MeasurementUnit): string {
  const normalized = Number.isInteger(value) ? String(value) : String(value);
  return unit === "inches" ? `${normalized} inches` : `${normalized} cm`;
}

export function isMeasurementSize(size: string): boolean {
  return MEASUREMENT_SIZE_RE.test(size.trim());
}

export function parseMeasurementSize(size: string): { value: number; unit: MeasurementUnit } | null {
  const match = size.trim().match(MEASUREMENT_SIZE_RE);
  if (!match) return null;
  return {
    value: Number(match[1]),
    unit: match[2]!.toLowerCase() === "inches" ? "inches" : "cm",
  };
}

/** Short label for storefront buttons (e.g. 28″, 70 cm). */
export function displaySizeLabel(size: string): string {
  const parsed = parseMeasurementSize(size);
  if (!parsed) return size;
  return parsed.unit === "inches" ? `${parsed.value}″` : `${parsed.value} cm`;
}

export function productUsesMeasurements(sizes: string[]): boolean {
  return sizes.length > 0 && sizes.every(isMeasurementSize);
}

export function sizeFieldLabel(sizes: string[]): string {
  return productUsesMeasurements(sizes) ? "Select measurement" : "Select size";
}

export function orderSizeLabel(size: string): string {
  return isMeasurementSize(size) ? "Measurement" : "Size";
}
