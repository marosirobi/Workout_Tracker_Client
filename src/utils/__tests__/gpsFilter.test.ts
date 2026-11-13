import { classifySample, type GpsFix } from "@/utils/gpsFilter";

const METERS_PER_DEGREE = 111_195;

const fix = (metersNorth: number, seconds: number): GpsFix => ({
  latitude: 47 + metersNorth / METERS_PER_DEGREE,
  longitude: 19,
  timestamp: seconds * 1000,
});

describe("classifySample", () => {
  const last = fix(0, 0);

  test("realistic speed is accepted", () => {
    expect(classifySample(last, null, fix(50, 10))).toEqual({ kind: "accept" });
  });

  test("first jump is held", () => {
    expect(classifySample(last, null, fix(1000, 10))).toEqual({ kind: "hold" });
  });

  test("consistent samples after a jump relocate", () => {
    const pending = fix(1000, 10);

    expect(classifySample(last, pending, fix(1040, 20))).toEqual({
      kind: "relocate",
      from: pending,
    });
  });

  test("another jump keeps holding", () => {
    expect(classifySample(last, fix(1000, 10), fix(3000, 20))).toEqual({ kind: "hold" });
  });

  test("same timestamp is treated as a jump", () => {
    expect(classifySample(last, null, fix(10, 0))).toEqual({ kind: "hold" });
  });
});
