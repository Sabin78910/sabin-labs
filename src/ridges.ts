/** Procedural Himalayan ridgelines for the hero, as SVG paths. Deterministic per seed. */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A closed ridge path across `width`, peaking between `top` and `base` (SVG y grows downwards).
 * Midpoint displacement gives sharp, mountain-like peaks; `rough` controls jaggedness.
 */
export function ridgePath(seed: number, width: number, height: number, top: number, base: number, rough = 0.55): string {
  const r = rng(seed);
  const n = 64;
  const ys = new Array<number>(n + 1).fill(0);
  ys[0] = base - r() * (base - top) * 0.4;
  ys[n] = base - r() * (base - top) * 0.4;
  let span = base - top;
  for (let step = n; step > 1; step /= 2) {
    for (let i = step / 2; i < n; i += step) {
      const mid = (ys[i - step / 2] + ys[i + step / 2]) / 2;
      ys[i] = mid + (r() - 0.62) * span;
    }
    span *= rough;
  }
  const pts = ys.map((y, i) => `${((i / n) * width).toFixed(1)},${Math.min(base, Math.max(top, y)).toFixed(1)}`);
  return `M0,${height} L${pts.join(" L")} L${width},${height} Z`;
}

/** Highest point (smallest y) of a ridge path, used to place the alpenglow. */
export function peakY(path: string): number {
  const ys = [...path.matchAll(/,(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  return Math.min(...ys);
}
