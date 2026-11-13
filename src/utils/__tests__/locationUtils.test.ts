import { calculateDistance } from "@/utils/locationUtils";

describe("calculateDistance (km)", () => {
  test("same point is zero", () => {
    expect(calculateDistance(47.4979, 19.0402, 47.4979, 19.0402)).toBe(0);
  });

  test("one degree of latitude", () => {
    expect(calculateDistance(0, 0, 1, 0)).toBeCloseTo(111.195, 2);
  });

  test("Budapest to Debrecen", () => {
    expect(calculateDistance(47.4979, 19.0402, 47.5316, 21.6273)).toBeCloseTo(194.32, 1);
  });

  test("is symmetric", () => {
    const there = calculateDistance(47.4979, 19.0402, 46.253, 20.1414);
    const back = calculateDistance(46.253, 20.1414, 47.4979, 19.0402);
    expect(there).toBeCloseTo(back, 9);
  });
});
