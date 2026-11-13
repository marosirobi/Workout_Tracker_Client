import i18n from "@/i18n";
import {
  MAX_BODY_WEIGHT,
  MIN_BODY_WEIGHT,
  validateBodyWeight,
} from "@/utils/bodyWeight";

const rangeMessage = () =>
  i18n.t("bodyWeight.range", { min: MIN_BODY_WEIGHT, max: MAX_BODY_WEIGHT });

describe("validateBodyWeight", () => {
  test.each(["80", "80,5", "80.5", "20", "400"])("%s is valid", (input) => {
    expect(validateBodyWeight(input)).toBeNull();
  });

  test("empty input is required", () => {
    expect(validateBodyWeight("  ")).toBe(i18n.t("bodyWeight.required"));
  });

  test.each(["19,9", "400,1", "abc"])("%s is out of range", (input) => {
    expect(validateBodyWeight(input)).toBe(rangeMessage());
  });
});
