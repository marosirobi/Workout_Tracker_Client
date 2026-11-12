import i18n from "@/i18n";
import { parseDecimalInput } from "@/utils/numberInput";

export const MIN_BODY_WEIGHT = 20;
export const MAX_BODY_WEIGHT = 400;

export function validateBodyWeight(text: string): string | null {
  if (text.trim() === "") {
    return i18n.t("bodyWeight.required");
  }
  const weight = parseDecimalInput(text);
  if (weight === null || weight < MIN_BODY_WEIGHT || weight > MAX_BODY_WEIGHT) {
    return i18n.t("bodyWeight.range", {
      min: MIN_BODY_WEIGHT,
      max: MAX_BODY_WEIGHT,
    });
  }
  return null;
}
