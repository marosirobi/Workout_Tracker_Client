import {
  decimalSeparator,
  formatDecimal,
  formatInteger,
} from "@/utils/numberFormat";

const normalize = (text: string) => text.replace(/\s/g, " ");

describe("formatInteger", () => {
  test.each([
    [12500, "hu-HU", "12 500"],
    [12500, "en-US", "12,500"],
    [1500, "hu-HU", "1500"],
    [1500, "en-US", "1,500"],
    [999.6, "hu-HU", "1000"],
  ])("%d in %s -> %s", (value, locale, expected) => {
    expect(normalize(formatInteger(value, locale))).toBe(expected);
  });
});

describe("formatDecimal", () => {
  test.each([
    [5.234, "hu-HU", 2, true, "5,23"],
    [5.234, "en-US", 2, true, "5.23"],
    [5, "hu-HU", 2, true, "5,00"],
    [80, "hu-HU", 1, false, "80"],
    [82.5, "hu-HU", 1, false, "82,5"],
    [82.5, "en-US", 1, false, "82.5"],
    [1234.56, "hu-HU", 2, true, "1234,56"],
  ])("%d in %s (%d digits, fixed=%s) -> %s", (value, locale, digits, fixed, expected) => {
    expect(normalize(formatDecimal(value, locale, digits, fixed))).toBe(expected);
  });
});

describe("decimalSeparator", () => {
  test("hungarian uses comma", () => {
    expect(decimalSeparator("hu-HU")).toBe(",");
  });

  test("english uses dot", () => {
    expect(decimalSeparator("en-US")).toBe(".");
  });
});
