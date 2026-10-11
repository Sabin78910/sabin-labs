import { heroMode, ridgeHeight } from "./hero/support";

describe("heroMode", () => {
  const base = { reducedMotion: false, webgl: true, cores: 8, memory: 8, saveData: false };
  test("runs WebGL on capable devices", () => expect(heroMode(base)).toBe("webgl"));
  test.each([
    ["reduced motion", { reducedMotion: true }],
    ["no WebGL", { webgl: false }],
    ["Save-Data", { saveData: true }],
    ["2 CPU cores", { cores: 2 }],
    ["2 GB memory", { memory: 2 }],
  ])("falls back to the static poster with %s", (_, o) => expect(heroMode({ ...base, ...o })).toBe("static"));
});

test("ridge heights are never negative and the far range is taller than the foothills", () => {
  const xs = Array.from({ length: 81 }, (_, i) => i / 40 - 1);
  const peak = (z: number) => Math.max(...xs.map((x) => ridgeHeight(x, z)));
  expect(Math.min(...xs.map((x) => ridgeHeight(x, 0.5)))).toBeGreaterThanOrEqual(0);
  expect(peak(1)).toBeGreaterThan(peak(0.1) * 2);
});
