import { useEffect, useMemo, useRef, useState } from "react";
import { appSyncState, codeLabel, createCode, eraseAll, readCode, saveCode, type AppSync } from "./account";
import { byCategory, CATEGORIES, PRODUCTS, STATS, SYNC_APPS, type Product } from "./catalog";
import { peakY, ridgePath } from "./ridges";
import { classify, probe, summary, type Health } from "./status";
import { parseSyncCode } from "./sync";

const storage = typeof localStorage !== "undefined" ? localStorage : undefined;
const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function Hero() {
  const ridges = useMemo(
    () => [
      { d: ridgePath(11, 1440, 560, 300, 430, 0.58), cls: "r1" },
      { d: ridgePath(23, 1440, 560, 360, 470, 0.55), cls: "r2" },
      { d: ridgePath(37, 1440, 560, 420, 510, 0.5), cls: "r3" },
      { d: ridgePath(51, 1440, 560, 480, 548, 0.45), cls: "r4" },
    ],
    [],
  );
  const glowY = peakY(ridges[0].d);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion()) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      el.style.setProperty("--px", x.toFixed(3));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <header className="hero" ref={ref}>
      <svg className="hero__art" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--sky-top)" />
            <stop offset="0.55" stopColor="var(--sky-mid)" />
            <stop offset="1" stopColor="var(--sky-low)" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0" r="0.6">
            <stop offset="0" stopColor="#FFC56B" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FF7A85" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE3C4" />
            <stop offset="0.25" stopColor="#F2B8B0" />
            <stop offset="1" stopColor="var(--ridge-1)" />
          </linearGradient>
        </defs>
        <rect width="1440" height="560" fill="url(#sky)" />
        <g className="stars">
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={(i * 211) % 1440} cy={(i * 97) % 220} r={i % 7 === 0 ? 1.6 : 0.9} style={{ animationDelay: `${(i % 9) * 0.4}s` }} />
          ))}
        </g>
        <ellipse cx="720" cy={glowY} rx="620" ry="260" fill="url(#glow)" />
        {ridges.map((r, i) => (
          <path key={r.cls} d={r.d} className={`ridge ${r.cls}`} fill={i === 0 ? "url(#snow)" : undefined} />
        ))}
      </svg>
      <nav className="nav" aria-label="Main">
        <a className="brand" href="#top" aria-label="Sabin Labs home">
          <Logo />
          <span>Sabin Labs</span>
        </a>
        <div className="nav__links">
          <a href="#products">Products</a>
          <a href="#platform">Platform</a>
          <a href="#company">Company</a>
          <a href="#status">Status</a>
          <a className="nav__cta" href="#account">
            Sabin Labs ID
          </a>
        </div>
      </nav>
      <div className="hero__copy" id="top">
        <p className="eyebrow">Kathmandu · Software for everyone</p>
        <h1>
          Built in the Himalaya.
          <br />
          <em>Made for the world.</em>
        </h1>
        <p className="lede">
          Fifteen fast, fair and beautiful products: games, money, news and productivity. One encrypted account links them all,
          and an automated engineering platform ships improvements every day.
        </p>
        <div className="hero__ctas">
          <a className="btn btn--primary" href="#products">
            Explore the products
          </a>
          <a className="btn btn--ghost" href="#account">
            Get your Sabin Labs ID
          </a>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC56B" />
          <stop offset="1" stopColor="#FF7A85" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="var(--logo-bg)" />
      <path d="M4 24 L12 11 L16 17 L20 9 L28 24 Z" fill="url(#lg)" />
      <path d="M17.6 13 L20 9 L22.3 13 L20 12 Z" fill="#fff" opacity="0.9" />
    </svg>
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

function ProductCard({ p, h }: { p: Product; h: Health }) {
  return (
    <article className={`card${p.featured ? " card--featured" : ""}`}>
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

function Products({ health }: { health: Record<string, Health> }) {
  const [cat, setCat] = useState<"All" | (typeof CATEGORIES)[number]>("All");
  const groups = byCategory();
  const list = cat === "All" ? PRODUCTS : groups.get(cat)!;
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
          <ProductCard key={p.id} p={p} h={health[p.id]} />
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
      <div className="stats">
        {STATS.map((s) => (
          <div key={s.label} className="stat">
            <strong>
              <CountUp to={s.value} suffix={"suffix" in s ? s.suffix : ""} />
            </strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
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
  return (
    <>
      <a className="skip" href="#products">
        Skip to products
      </a>
      <Hero />
      <main>
        <Products health={health} />
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
