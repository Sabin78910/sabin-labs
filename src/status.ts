/** Live status checks for the status page and product cards. */

export type Health = "checking" | "up" | "slow" | "down" | "n/a";

export interface Probe {
  ok: boolean;
  ms: number;
  timedOut: boolean;
}

/** Free-tier APIs on Render sleep and take ~30-50 s to wake, so a timeout reads as "slow", not "down". */
export function classify(p: Probe, slowMs = 2500): Exclude<Health, "checking" | "n/a"> {
  if (p.timedOut) return "slow";
  if (!p.ok) return "down";
  return p.ms > slowMs ? "slow" : "up";
}

/**
 * Pings a URL from the browser. Cross-origin endpoints don't all send CORS headers, so this uses
 * no-cors: an opaque response still proves the server answered; a network error means it didn't.
 */
export async function probe(url: string, timeoutMs = 9000, fetchImpl: typeof fetch = fetch): Promise<Probe> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  try {
    await fetchImpl(url, { mode: "no-cors", cache: "no-store", signal: ctrl.signal });
    return { ok: true, ms: Math.round(performance.now() - start), timedOut: false };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - start), timedOut: ctrl.signal.aborted };
  } finally {
    clearTimeout(timer);
  }
}

export function summary(states: Health[]): { up: number; total: number; label: string } {
  const counted = states.filter((s) => s !== "n/a");
  const up = counted.filter((s) => s === "up" || s === "slow").length;
  const checking = counted.some((s) => s === "checking");
  const label = checking
    ? "Checking systems…"
    : up === counted.length
      ? "All systems operational"
      : `${counted.length - up} of ${counted.length} systems need attention`;
  return { up, total: counted.length, label };
}
