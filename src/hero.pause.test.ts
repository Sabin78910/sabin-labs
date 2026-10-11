import { PAUSE_KEY, readPaused, togglePaused, writePaused } from "./hero/pause";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
};

describe("hero pause state", () => {
  test("toggles between playing and paused", () => {
    expect(togglePaused(false)).toBe(true);
    expect(togglePaused(true)).toBe(false);
  });
  test("defaults to playing when nothing is stored", () => expect(readPaused(mem())).toBe(false));
  test("remembers the choice", () => {
    const s = mem();
    writePaused(true, s);
    expect(s.getItem(PAUSE_KEY)).toBe("1");
    expect(readPaused(s)).toBe(true);
    writePaused(false, s);
    expect(readPaused(s)).toBe(false);
  });
  test("survives storage that throws", () => {
    const bad = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(readPaused(bad)).toBe(false);
    expect(() => writePaused(true, bad)).not.toThrow();
  });
});
