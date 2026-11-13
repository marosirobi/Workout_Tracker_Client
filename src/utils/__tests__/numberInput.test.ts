import {
  formatDecimalInput,
  parseDecimalInput,
  sanitizeDecimal,
  sanitizeInteger,
} from "@/utils/numberInput";

describe("sanitizeDecimal", () => {
  test.each([
    ["82,5", "82,5"],
    ["82.5", "82.5"],
    ["12,5,3", "12,53"],
    ["1.2,3", "1.23"],
    ["a1b2.3kg", "12.3"],
    ["", ""],
  ])("%s -> %s", (input, expected) => {
    expect(sanitizeDecimal(input)).toBe(expected);
  });
});

test("sanitizeInteger keeps only digits", () => {
  expect(sanitizeInteger("1a2,3 4")).toBe("1234");
});

describe("parseDecimalInput", () => {
  test.each([
    ["82,5", 82.5],
    ["82.5", 82.5],
    ["80", 80],
    ["", 0],
    ["   ", 0],
    ["abc", null],
  ])("%s -> %s", (input, expected) => {
    expect(parseDecimalInput(input)).toBe(expected);
  });
});

describe("formatDecimalInput", () => {
  test.each([
    [82.5, "hu-HU", "82,5"],
    [82.5, "en-US", "82.5"],
    [82.456, "hu-HU", "82,46"],
    [80, "hu-HU", "80"],
    [1500, "hu-HU", "1500"],
    [0, "hu-HU", ""],
  ])("%d in %s -> %s", (value, locale, expected) => {
    expect(formatDecimalInput(value, locale)).toBe(expected);
  });
});
