import { useEffect, useMemo, useRef, useState } from "react";
import { appSyncState, codeLabel, createCode, eraseAll, readCode, saveCode, type AppSync } from "./account";
import { byCategory, CATEGORIES, PRODUCTS, STATS, SYNC_APPS, type Product } from "./catalog";
import { readPaused, togglePaused, writePaused } from "./hero/pause";
import { heroMode, readHeroEnv, ridgeHeight } from "./hero/support";
import { classify, probe, summary, type Health } from "./status";
import { parseSyncCode } from "./sync";

const storage = typeof localStorage !== "undefined" ? localStorage : undefined;
const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Product deep links: #product/<id> focuses and scrolls to one card. */
export function parseProductHash(hash: string): string | null {
  const m = /^#\/?product\/([a-z0-9-]+)$/i.exec(hash);
  return m ? m[1].toLowerCase() : null;
}

function useProductHash(): string | null {
  const [focused, setFocused] = useState<string | null>(() => parseProductHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setFocused(parseProductHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return focused;
}

function useScrollToProduct(focused: string | null) {
  useEffect(() => {
    if (!focused) return;
    const el = document.getElementById(`product-${focused}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" });
  }, [focused]);
}

function useHealth(): Record<string, Health> {
  const [health, setHealth] = useState<Record<string, Health>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.health ? "checking" : "n/a"])),
  );
  useEffect(() => {
    let alive = true;
    for (const p of PRODUCTS) {
      if (!p.health) continue;
      void probe(p.health).then((r) => alive && setHealth((h) => ({ ...h, [p.id]: classify(r) })));
    }
    return () => {
      alive = false;
    };
  }, []);
  return health;
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(() => (reduceMotion() ? to : 0));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduceMotion()) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setN(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200);
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref}>
      {n.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

const LAYERS = [
  { z: 1, base: 440, scale: 210, cls: "far" },
  { z: 0.62, base: 490, scale: 160, cls: "mid" },
  { z: 0.28, base: 545, scale: 110, cls: "near" },
];

/** Static range drawn from the same height function: the LCP-safe poster and the low-motion fallback. */
function RidgePoster() {
  const paths = useMemo(
    () =>
      LAYERS.map(({ z, base, scale, cls }) => {
        const pts: string[] = [];
        for (let i = 0; i <= 80; i++) {
          const u = (i / 80) * 2 - 1;
          pts.push(`${(i * 12.5).toFixed(1)},${(base - ridgeHeight(u, z) * scale).toFixed(1)}`);
        }
        return { cls, d: `M0,600 L${pts.join(" L")} L1000,600 Z` };
      }),
    [],
  );
  return (
    <svg className="hero-poster" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      {paths.map((p) => (
        <path key={p.cls} className={`ridge ridge-${p.cls}`} d={p.d} />
      ))}
    </svg>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Sabin Labs home">
        <span className="brand__mark" aria-hidden="true">
          SL
        </span>
        <span className="brand__name">Sabin Labs</span>
      </a>
      <nav className="nav" aria-label="Main">
        <a href="#products">Products</a>
        <a href="#platform">Platform</a>
        <a href="#company">Company</a>
        <a href="#status">Status</a>
        <a className="nav-cta" href="#account">
          Sabin Labs ID
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(readPaused);
  const handle = useRef<{ setPaused(p: boolean): void } | null>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    if (heroMode(readHeroEnv()) !== "webgl") return;
    let dead = false;
    let destroy = () => {};
    const start = () =>
      import("./hero/ridge").then(({ startRidge }) => {
        if (dead || !canvas.current) return;
        const h = startRidge(canvas.current);
        if (h) {
          destroy = h.destroy;
          handle.current = h;
          h.setPaused(pausedRef.current);
          setCount(h.count);
        }
      });
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start);
    else setTimeout(start, 150);
    return () => {
      dead = true;
      destroy();
    };
  }, []);
  const onToggle = () => {
    const next = togglePaused(paused);
    pausedRef.current = next;
    setPaused(next);
    writePaused(next);
    handle.current?.setPaused(next);
  };
  return (
    <section className="hero" aria-label="Introduction" id="top">
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <RidgePoster />
      <div className="blob blob-violet" aria-hidden="true" />
      <div className="blob blob-cyan" aria-hidden="true" />
      <div className="hero-inner">
        <p className="kicker">
          <span className="dot" aria-hidden="true" /> Software company · Kathmandu, Nepal
        </p>
        <h1>Sabin Labs</h1>
        <p className="tagline">Built in the Himalaya. Made for the world.</p>
        <p className="hero-sub">
          Fifteen fast, fair and beautiful products: games, money, news and productivity. One encrypted account links them all,
          and an automated engineering platform ships improvements every day.
        </p>
        <div className="cta">
          <a className="btn" href="#products">
            Explore the products
          </a>
          <a className="btn btn-ghost" href="#account">
            Get your Sabin Labs ID
          </a>
        </div>
      </div>
      {count > 0 && (
        <button type="button" className="btn btn-ghost motion-toggle" aria-pressed={paused} onClick={onToggle}>
          {paused ? "Play motion" : "Pause motion"}
        </button>
      )}
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="stats" role="list" aria-label="Sabin Labs at a glance">
      {STATS.map((s) => (
        <div key={s.label} className="stat" role="listitem">
          <strong>
            <CountUp to={s.value} suffix={"suffix" in s ? s.suffix : ""} />
          </strong>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

const DOT_LABEL: Record<Health, string> = {
  checking: "Checking",
  up: "Online",
  slow: "Waking up",
  down: "Offline",
  "n/a": "In Play testing",
};

function StatusDot({ h }: { h: Health }) {
  return (
    <span className={`dot dot--${h}`}>
      <i aria-hidden="true" />
      {DOT_LABEL[h]}
    </span>
  );
}

function ProductCard({ p, h, focused }: { p: Product; h: Health; focused?: boolean }) {
  return (
    <article id={`product-${p.id}`} className={`card${p.featured ? " card--featured" : ""}${focused ? " card--focused" : ""}`}>
      <div className="card__media" style={{ ["--accent" as string]: p.accent }}>
        {p.shot ? (
          <img src={p.shot} alt={`${p.name} screenshot`} loading="lazy" decoding="async" />
        ) : (
          <span className="card__glyph" aria-hidden="true">
            {p.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
        )}
      </div>
      <div className="card__body">
        <div className="card__top">
          <h3>{p.name}</h3>
          <StatusDot h={h} />
        </div>
        <p className="card__tagline">{p.tagline}</p>
        <p className="card__edge">{p.edge}</p>
        <div className="card__foot">
          <span className="chips">
            {p.platforms.map((pl) => (
              <span key={pl} className="chip">
                {pl}
              </span>
            ))}
            {p.syncId && <span className="chip chip--sync">Sabin Labs ID</span>}
          </span>
          <span className="card__links">
            <a href={`#/product/${p.id}`} aria-label={`Focus ${p.name}`}>
              Link
            </a>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener">
                Open ↗
              </a>
            )}
            <a href={p.repo} target="_blank" rel="noopener">
              Code
            </a>
          </span>
        </div>
      </div>
    </article>
  );
}

function Products({ health, focused }: { health: Record<string, Health>; focused: string | null }) {
  const [cat, setCat] = useState<"All" | (typeof CATEGORIES)[number]>("All");
  const groups = byCategory();
  const list = cat === "All" ? PRODUCTS : groups.get(cat)!;
  useScrollToProduct(focused);
  return (
    <section id="products" className="section" aria-labelledby="products-h">
      <p className="eyebrow">The suite</p>
      <h2 id="products-h">Fifteen products, one standard</h2>
      <p className="section__lede">
        Each one is researched against its category leader, then built to beat it on speed, fairness and feel. Status dots are live.
      </p>
      <div className="tabs" role="tablist" aria-label="Filter products">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
            {c}
            <span>{c === "All" ? PRODUCTS.length : groups.get(c)!.length}</span>
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} h={health[p.id]} focused={focused === p.id} />
        ))}
      </div>
    </section>
  );
}

function Account() {
  const [code, setCode] = useState<string | null>(() => readCode(storage));
  const [paste, setPaste] = useState("");
  const [bad, setBad] = useState(false);
  const [copied, setCopied] = useState(false);
  const [states, setStates] = useState<Record<string, AppSync | "checking">>({});
  const [confirmErase, setConfirmErase] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!code) return;
    setStates(Object.fromEntries(SYNC_APPS.map((a) => [a.syncId!, "checking" as const])));
    let alive = true;
    for (const a of SYNC_APPS) {
      void appSyncState(code, a.syncId!).then((r) => alive && setStates((s) => ({ ...s, [a.syncId!]: r.state })));
    }
    return () => {
      alive = false;
    };
  }, [code]);

  const use = (c: string | null) => {
    saveCode(storage, c);
    setCode(c);
    setConfirmErase(false);
  };

  return (
    <section id="account" className="section account" aria-labelledby="account-h">
      <div className="account__intro">
        <p className="eyebrow">Sabin Labs ID</p>
        <h2 id="account-h">One code. Every app. Nobody else can read it.</h2>
        <p className="section__lede">
          Your Sabin Labs ID is a private code made on your device. It encrypts your data before it leaves, so our servers store
          only ciphertext. There's no password to leak and no email to give. Save it here once and every Sabin Labs web app in this
          browser uses it.
        </p>
        <ul className="ticks">
          <li>AES-256-GCM end-to-end encryption, with keys derived on your device</li>
          <li>Works across phone and laptop: paste the same code on each</li>
          <li>Erase everything at any time, in one tap</li>
        </ul>
      </div>
      <div className="panel">
        {code ? (
          <>
            <div className="panel__row">
              <span className="panel__label">Active ID</span>
              <strong className="mono">{codeLabel(code)}</strong>
            </div>
            <label className="panel__label" htmlFor="id-code">
              Your full code. Keep it private, and paste it on your other devices.
            </label>
            <div className="panel__row">
              <input id="id-code" className="input mono" readOnly value={code} onFocus={(e) => e.target.select()} />
              <button
                className="btn btn--primary"
                onClick={async (e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                  try {
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  } catch {
                    input?.select();
                  }
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <ul className="apps" aria-label="Sync status by app">
              {SYNC_APPS.map((a) => {
                const s = states[a.syncId!] ?? "checking";
                return (
                  <li key={a.id}>
                    <span>{a.name}</span>
                    <span className={`pill pill--${s}`}>
                      {s === "synced" ? "Synced" : s === "not-yet" ? "Not synced yet" : s === "error" ? "Couldn't check" : "Checking…"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="panel__row panel__row--wrap">
              <button className="btn btn--ghost" onClick={() => use(null)}>
                Sign out on this browser
              </button>
              {!confirmErase ? (
                <button className="btn btn--danger-ghost" onClick={() => setConfirmErase(true)}>
                  Erase all synced data…
                </button>
              ) : (
                <span className="confirm" role="alert">
                  This permanently deletes every app's synced data for this ID.
                  <button
                    className="btn btn--danger"
                    onClick={async () => {
                      const ok = await eraseAll(code).catch(() => false);
                      setNotice(ok ? "All synced data was erased." : "Couldn't erase right now. Try again.");
                      if (ok) use(null);
                    }}
                  >
                    Erase permanently
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmErase(false)}>
                    Cancel
                  </button>
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn--primary btn--wide" onClick={() => use(createCode())}>
              Create my Sabin Labs ID
            </button>
            <form
              className="panel__row"
              onSubmit={(e) => {
                e.preventDefault();
                const c = paste.trim();
                if (parseSyncCode(c)) {
                  use(c);
                  setPaste("");
                } else setBad(true);
              }}
            >
              <input
                id="id-paste"
                className="input mono"
                placeholder="Already have one? Paste it here"
                aria-label="Paste an existing Sabin Labs ID"
                aria-invalid={bad}
                value={paste}
                onChange={(e) => {
                  setPaste(e.target.value);
                  setBad(false);
                }}
              />
              <button className="btn btn--ghost" type="submit" disabled={!paste.trim()}>
                Use it
              </button>
            </form>
            {bad && (
              <p className="error" role="alert">
                That isn't a Sabin Labs ID. Copy it again from your other device; it starts with SS1-.
              </p>
            )}
          </>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}

const PIPELINE = [
  { t: "Research", d: "Every feature starts from the category leader's reviews, rankings and gaps." },
  { t: "AI engineer", d: "A cloud Claude agent picks the next task, writes tests and code, and opens a PR, 24/7." },
  { t: "CI gates", d: "Lint, types, tests, CodeQL security scans and dependency audits on every change." },
  { t: "Ship", d: "Auto-deploy to the web and signed Android builds; Workers update globally." },
  { t: "Watch", d: "Visual QA on phone and desktop, uptime checks, and auto-filed fixes when anything breaks." },
];

function Platform() {
  return (
    <section id="platform" className="section" aria-labelledby="platform-h">
      <p className="eyebrow">How we build</p>
      <h2 id="platform-h">A company that keeps shipping while it sleeps</h2>
      <p className="section__lede">
        Sixteen repositories, each with its own pipeline. The loop below runs in the cloud on GitHub and Cloudflare, with no laptop
        required.
      </p>
      <ol className="pipeline">
        {PIPELINE.map((s, i) => (
          <li key={s.t} style={{ ["--i" as string]: i }}>
            <span className="pipeline__n">{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const PRINCIPLES = [
  { t: "Fair by design", d: "Dice you can verify, puzzles without lives or energy walls, no ads in the middle of play." },
  { t: "Private by architecture", d: "End-to-end encryption, offline-first apps, no data sold. We can't read your data." },
  { t: "Delight that respects you", d: "Streaks, levels and celebrations for real progress. No dark patterns, no fake urgency." },
  { t: "Nepal first, world ready", d: "Nepali and English, lakh and crore, NEPSE and Bikram Sambat, built to scale globally." },
];

const BETS = [
  { n: "01", t: "Block Drop", d: "Closest to revenue: a fair block puzzle in a market Block Blast proved at hundreds of millions of installs." },
  { n: "02", t: "NEPSE Lens Pro", d: "Broker accumulation, alerts and portfolio tools for Nepal's investors, as a subscription." },
  { n: "03", t: "Khabar Pulse", d: "The daily news habit for Nepali readers at home and abroad." },
  { n: "04", t: "Shop ledger", d: "Inventory and credit ledger for Nepal's small shops, on the Inventory API and Expense Tracker." },
];

function Company() {
  return (
    <section id="company" className="section" aria-labelledby="company-h">
      <p className="eyebrow">Company</p>
      <h2 id="company-h">What we believe, and where we're going</h2>
      <div className="principles">
        {PRINCIPLES.map((p) => (
          <div key={p.t} className="principle">
            <h3>{p.t}</h3>
            <p>{p.d}</p>
          </div>
        ))}
      </div>
      <h3 className="subhead">Focus bets</h3>
      <ol className="bets">
        {BETS.map((b) => (
          <li key={b.n}>
            <span className="bets__n">{b.n}</span>
            <div>
              <strong>{b.t}</strong>
              <p>{b.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="founder">
        Founded and led by{" "}
        <a href="https://sabin78910.github.io/portfolio-web/" target="_blank" rel="noopener">
          Sabin Khanal
        </a>
        , Kathmandu.{" "}
        <a href="https://github.com/Sabin78910" target="_blank" rel="noopener">
          GitHub
        </a>
      </p>
    </section>
  );
}

function Status({ health }: { health: Record<string, Health> }) {
  const s = summary(PRODUCTS.map((p) => health[p.id]));
  const allUp = s.up === s.total;
  return (
    <section id="status" className="section" aria-labelledby="status-h">
      <p className="eyebrow">Status</p>
      <h2 id="status-h">
        <span className={`status-badge${allUp ? " ok" : ""}`} aria-hidden="true" />
        {s.label}
      </h2>
      <p className="section__lede">
        Checked live from your browser just now: {s.up} of {s.total} online. Free-tier APIs can take up to a minute to wake.
      </p>
      <ul className="status-list">
        {PRODUCTS.filter((p) => p.health).map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <StatusDot h={health[p.id]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function App() {
  const health = useHealth();
  const focused = useProductHash();
  return (
    <>
      <a className="skip" href="#products">
        Skip to products
      </a>
      <Topbar />
      <main>
        <Hero />
        <StatsStrip />
        <Products health={health} focused={focused} />
        <Account />
        <Platform />
        <Company />
        <Status health={health} />
      </main>
      <footer className="footer">
        <span>© 2026 Sabin Labs · Kathmandu, Nepal</span>
        <span className="footer__links">
          <a href="https://sabin78910.github.io/privacy-policy/" target="_blank" rel="noopener">
            Privacy
          </a>
          <a href="https://github.com/Sabin78910/sabin-labs" target="_blank" rel="noopener">
            Source
          </a>
          <span lang="ne">हिमालमा बनाइएको</span>
        </span>
      </footer>
    </>
  );
}
