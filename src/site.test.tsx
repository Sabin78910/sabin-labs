import { render, screen } from "@testing-library/react";
import App from "./App";
import { appSyncState, codeLabel, eraseAll, readCode, saveCode, SHARED_CODE_KEY } from "./account";
import { byCategory, CATEGORIES, PRODUCTS, SYNC_APPS } from "./catalog";
import { peakY, ridgePath } from "./ridges";
import { classify, probe, summary } from "./status";
import { newSyncCode, parseSyncCode } from "./sync";

function memStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe("catalog", () => {
  it("lists 15 products with unique ids and complete data", () => {
    expect(PRODUCTS).toHaveLength(15);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(15);
    for (const p of PRODUCTS) {
      expect(p.repo).toMatch(/^https:\/\/github\.com\/Sabin78910\//);
      expect(p.tagline.length).toBeGreaterThan(20);
      expect(p.edge.length).toBeGreaterThan(20);
      expect(p.platforms.length).toBeGreaterThan(0);
      expect(p.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
  it("groups every product into exactly one known category", () => {
    const groups = byCategory();
    expect([...groups.keys()]).toEqual(CATEGORIES);
    expect([...groups.values()].flat()).toHaveLength(PRODUCTS.length);
  });
  it("has unique sync ids that match the apps' own ids", () => {
    const ids = SYNC_APPS.map((a) => a.syncId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("prism-pop");
  });
  it("points health checks only at our own hosts", () => {
    for (const p of PRODUCTS.filter((x) => x.health)) {
      expect(p.health).toMatch(/^https:\/\/(sabin78910\.github\.io|[a-z0-9-]+\.sabin-apps\.workers\.dev|[a-z0-9-]+\.onrender\.com)\//);
    }
  });
});

describe("status", () => {
  it("classifies probes", () => {
    expect(classify({ ok: true, ms: 200, timedOut: false })).toBe("up");
    expect(classify({ ok: true, ms: 4000, timedOut: false })).toBe("slow");
    expect(classify({ ok: false, ms: 9000, timedOut: true })).toBe("slow");
    expect(classify({ ok: false, ms: 50, timedOut: false })).toBe("down");
  });
  it("summarises, ignoring products without an endpoint", () => {
    expect(summary(["up", "slow", "n/a"]).label).toBe("All systems operational");
    expect(summary(["up", "down"]).label).toBe("1 of 2 systems need attention");
    expect(summary(["up", "checking"]).label).toBe("Checking systems…");
  });
  it("tries CORS first, falls back to no-cors, and reports failures", async () => {
    const modes: string[] = [];
    const corsOk = (async (_u: string, init?: RequestInit) => {
      modes.push(String(init?.mode));
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    expect((await probe("https://example.test/", 1000, corsOk)).ok).toBe(true);
    expect(modes).toEqual(["cors"]);
    modes.length = 0;
    const noCorsOnly = (async (_u: string, init?: RequestInit) => {
      modes.push(String(init?.mode));
      if (init?.mode === "cors") throw new TypeError("CORS blocked");
      return new Response(null);
    }) as unknown as typeof fetch;
    expect((await probe("https://example.test/", 1000, noCorsOnly)).ok).toBe(true);
    expect(modes).toEqual(["cors", "no-cors"]);
    const serverError = (async () => new Response(null, { status: 503 })) as unknown as typeof fetch;
    expect((await probe("https://example.test/", 1000, serverError)).ok).toBe(false);
    const fail = (async () => {
      throw new TypeError("network");
    }) as unknown as typeof fetch;
    expect((await probe("https://example.test/", 1000, fail)).ok).toBe(false);
  });
  it("times out slow endpoints", async () => {
    const hang = ((_u: string, init: RequestInit) =>
      new Promise((_, rej) => init.signal!.addEventListener("abort", () => rej(new Error("aborted"))))) as unknown as typeof fetch;
    const r = await probe("https://example.test/", 20, hang);
    expect(r.timedOut).toBe(true);
    expect(classify(r)).toBe("slow");
  });
});

describe("Sabin Labs ID", () => {
  it("saves one shared code that every app on the origin can read", () => {
    const s = memStorage();
    expect(readCode(s)).toBeNull();
    const code = newSyncCode();
    saveCode(s, code);
    expect(s.m.get(SHARED_CODE_KEY)).toBe(code);
    expect(readCode(s)).toBe(code);
    saveCode(s, null);
    expect(readCode(s)).toBeNull();
  });
  it("ignores a corrupted stored code", () => {
    const s = memStorage();
    s.setItem(SHARED_CODE_KEY, "garbage");
    expect(readCode(s)).toBeNull();
  });
  it("shows a short label that never reveals the secret", () => {
    const code = newSyncCode();
    const label = codeLabel(code);
    expect(label).toMatch(/^SL-[A-Z0-9_-]{4}-[A-Z0-9_-]{4}$/);
    const secret = code.split("-").slice(2).join("-");
    expect(label).not.toContain(secret.slice(0, 6).toUpperCase());
  });
  it("reports per-app sync state", async () => {
    const code = newSyncCode();
    const notFound = (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch;
    expect((await appSyncState(code, "todo-web", notFound)).state).toBe("not-yet");
    const forbidden = (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
    expect((await appSyncState(code, "todo-web", forbidden)).state).toBe("error");
  });
  it("erases with an auth token, never the secret", async () => {
    const code = newSyncCode();
    const p = parseSyncCode(code)!;
    const calls: [string, RequestInit][] = [];
    const f = (async (u: string, init: RequestInit) => {
      calls.push([u, init]);
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await eraseAll(code, f)).toBe(true);
    expect(calls[0][0]).toContain(`/v1/spaces/${p.spaceId}`);
    expect(calls[0][1].method).toBe("DELETE");
    expect(String((calls[0][1].headers as Record<string, string>).Authorization)).toMatch(/^Bearer [a-f0-9]{64}$/);
    expect(JSON.stringify(calls)).not.toContain(code.split("-").slice(2).join("-"));
    expect(await eraseAll("bad", f)).toBe(false);
  });
});

describe("ridges", () => {
  it("is deterministic and stays inside its band", () => {
    const a = ridgePath(11, 1440, 560, 150, 330);
    expect(a).toBe(ridgePath(11, 1440, 560, 150, 330));
    expect(a).not.toBe(ridgePath(12, 1440, 560, 150, 330));
    expect(a.startsWith("M0,560")).toBe(true);
    expect(peakY(a)).toBeGreaterThanOrEqual(150);
    expect(peakY(a)).toBeLessThanOrEqual(330);
  });
});

describe("site", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("renders the hero, every product, the account and status sections", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Built in the Himalaya");
    for (const p of PRODUCTS) expect(screen.getAllByRole("heading", { name: p.name }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Create my Sabin Labs ID" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /systems/i })).toBeInTheDocument();
  });
});
