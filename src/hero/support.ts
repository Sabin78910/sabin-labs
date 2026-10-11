export type HeroEnv = { reducedMotion: boolean; webgl: boolean; cores?: number; memory?: number; saveData?: boolean };
export type HeroMode = "webgl" | "static";

/** WebGL only when motion is welcome and the device can afford it; everything else gets the static poster. */
export function heroMode(env: HeroEnv): HeroMode {
  if (env.reducedMotion || !env.webgl || env.saveData) return "static";
  if ((env.cores ?? 8) <= 2 || (env.memory ?? 8) <= 2) return "static";
  return "webgl";
}

export function readHeroEnv(): HeroEnv {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    reducedMotion: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl: typeof window !== "undefined" && "WebGLRenderingContext" in window,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
  };
}

/** Height of the stylised Himalayan range at x (-1..1 across) and depth z (0 near .. 1 far). Pure, so it is testable. */
export function ridgeHeight(x: number, z: number): number {
  const n = (t: number) => Math.sin(t) * 0.5 + Math.sin(t * 2.17 + 1.3) * 0.3 + Math.sin(t * 4.31 + 0.7) * 0.15 + Math.sin(t * 8.9 + 2.1) * 0.05;
  const ridged = 1 - Math.abs(n(x * 3.4 + z * 7));
  const massif = Math.exp(-((x - 0.5) ** 2) / 0.2);
  // Lower on the left so the range frames the headline instead of running through it.
  const side = 0.35 + 0.65 * Math.min(1, Math.max(0, (x + 1) / 1.5));
  return Math.max(0, (0.08 + 0.95 * z * z) * ridged ** 2.4 * (0.5 + 0.7 * massif) * side + 0.02 * n(x * 23 + z * 13));
}
