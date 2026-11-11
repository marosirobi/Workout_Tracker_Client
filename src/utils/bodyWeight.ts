import { parseDecimalInput } from "@/utils/numberInput";

export const MIN_BODY_WEIGHT = 20;
export const MAX_BODY_WEIGHT = 400;

export function validateBodyWeight(text: string): string | null {
  if (text.trim() === "") {
    return "Add meg a testsúlyodat.";
  }
  const weight = parseDecimalInput(text);
  if (weight === null || weight < MIN_BODY_WEIGHT || weight > MAX_BODY_WEIGHT) {
    return `A testsúly ${MIN_BODY_WEIGHT} és ${MAX_BODY_WEIGHT} kg között lehet.`;
  }
  return null;
}
