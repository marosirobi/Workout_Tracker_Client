import { decimalSeparator } from "@/utils/numberFormat";

export function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.,]/g, "");
  const firstSeparator = cleaned.search(/[.,]/);
  if (firstSeparator === -1) return cleaned;

  return (
    cleaned.slice(0, firstSeparator + 1) +
    cleaned.slice(firstSeparator + 1).replace(/[.,]/g, "")
  );
}

export function sanitizeInteger(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

export function parseDecimalInput(text: string): number | null {
  if (text.trim() === "") return 0;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function formatDecimalInput(value: number, locale: string): string {
  if (!value) return "";
  return String(Math.round(value * 100) / 100).replace(
    ".",
    decimalSeparator(locale),
  );
}
