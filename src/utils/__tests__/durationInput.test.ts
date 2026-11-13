import {
  formatDurationInput,
  parseDurationInput,
  sanitizeDuration,
} from "@/utils/durationInput";

describe("formatDurationInput", () => {
  test.each([
    [0, ""],
    [45, "0:45"],
    [90, "1:30"],
    [605, "10:05"],
  ])("%d -> %s", (seconds, expected) => {
    expect(formatDurationInput(seconds)).toBe(expected);
  });
});

describe("sanitizeDuration", () => {
  test.each([
    ["1:30", "1:30"],
    ["1a:2:3", "1:23"],
    ["90s", "90"],
  ])("%s -> %s", (input, expected) => {
    expect(sanitizeDuration(input)).toBe(expected);
  });
});

describe("parseDurationInput", () => {
  test.each([
    ["", 0],
    ["90", 90],
    ["1:30", 90],
    ["1:3", 63],
    [":45", 45],
    ["2:", 120],
    ["1:75", null],
    ["abc", null],
  ])("%s -> %s", (input, expected) => {
    expect(parseDurationInput(input)).toBe(expected);
  });

  test("round trip", () => {
    expect(parseDurationInput(formatDurationInput(605))).toBe(605);
  });
});
