/** Every Sabin Labs product, in one place. The site, status page and tests all read from here. */

export type Category = "Games" | "Money" | "News & Weather" | "Productivity" | "Developer platform";
export type Platform = "Web" | "Android" | "API";

export interface Product {
  id: string;
  name: string;
  category: Category;
  tagline: string;
  /** What makes it better than the category leader, in one line. */
  edge: string;
  platforms: Platform[];
  url?: string;
  repo: string;
  /** Endpoint the status page pings. */
  health?: string;
  shot?: string;
  /** Accent for the card glyph when there is no screenshot. */
  accent: string;
  /** App id used for encrypted sync, when the app supports it. */
  syncId?: string;
  featured?: boolean;
}

const gh = (repo: string) => `https://github.com/Sabin78910/${repo}`;
const pages = (repo: string) => `https://sabin78910.github.io/${repo}/`;

export const PRODUCTS: Product[] = [
  {
    id: "block-drop",
    name: "Block Drop",
    category: "Games",
    tagline: "The fair block puzzle. Clear lines, chain combos, beat the daily board.",
    edge: "Fair piece generation and a seeded daily challenge, in a genre Block Blast proved with 368M downloads.",
    platforms: ["Android"],
    repo: gh("blockdrop-puzzle-unity"),
    shot: "shots/block-drop.jpg",
    accent: "#FF8A3D",
    featured: true,
  },
  {
    id: "ludo-live",
    name: "Ludo Live",
    category: "Games",
    tagline: "Online Ludo with friends, with dice anyone can verify.",
    edge: "Provably fair dice and no ads during matches, answering Ludo King's top complaints.",
    platforms: ["Web", "Android"],
    url: pages("ludo-live"),
    repo: gh("ludo-live"),
    health: "https://ludo-live.sabin-apps.workers.dev/",
    shot: "shots/ludo-live.webp",
    accent: "#EF3B4F",
    featured: true,
  },
  {
    id: "prism-pop",
    name: "Prism Pop",
    category: "Games",
    tagline: "Match-3 gems with power combos. No lives, no waiting.",
    edge: "No lives or energy timers and unlimited seeded levels, against Royal Match and Candy Crush.",
    platforms: ["Web", "Android"],
    url: pages("prism-pop-game"),
    repo: gh("prism-pop-game"),
    health: pages("prism-pop-game"),
    shot: "shots/prism-pop.webp",
    accent: "#B15CFF",
    syncId: "prism-pop",
  },
  {
    id: "nepse-lens",
    name: "NEPSE Lens",
    category: "Money",
    tagline: "Nepal's stock market on your phone, with broker accumulation per stock.",
    edge: "A mobile-first trading terminal next to desktop-first Merolagani and ShareSansar.",
    platforms: ["Web", "Android"],
    url: pages("nepse-lens"),
    repo: gh("nepse-lens"),
    health: "https://nepse-lens.sabin-apps.workers.dev/latest.json",
    shot: "shots/nepse-lens.webp",
    accent: "#22D3EE",
    syncId: "nepse-lens",
    featured: true,
  },
  {
    id: "loan",
    name: "Loan Calculator",
    category: "Money",
    tagline: "EMI, debt-free date and what prepaying saves, in lakh and crore.",
    edge: "Bankrate-level breakdowns plus instant 'you save' feedback and Nepal rate presets.",
    platforms: ["Web"],
    url: pages("loan-calculator-web"),
    repo: gh("loan-calculator-web"),
    health: pages("loan-calculator-web"),
    shot: "shots/loan-calculator.webp",
    accent: "#10B981",
    syncId: "loan-calculator-web",
  },
  {
    id: "emi",
    name: "EMI Calculator",
    category: "Money",
    tagline: "Loan manager for Android with prepayment and step-up planning.",
    edge: "Nepal-specific presets and payoff milestones that celebrate progress.",
    platforms: ["Android"],
    repo: gh("emi-calculator-android"),
    accent: "#4F46E5",
  },
  {
    id: "expense",
    name: "Expense Tracker",
    category: "Money",
    tagline: "Log a rupee in under five seconds. Private and offline.",
    edge: "Copilot-grade design without the subscription; the seed of a shop ledger for Nepal.",
    platforms: ["Android"],
    repo: gh("expense-tracker-android"),
    accent: "#14B8A6",
  },
  {
    id: "khabar-pulse",
    name: "Khabar Pulse",
    category: "News & Weather",
    tagline: "Nepal and world news from 37 sources, with the same story merged.",
    edge: "One clean feed with 'N sources' clusters instead of cluttered, ad-heavy portals.",
    platforms: ["Web", "Android"],
    url: pages("khabar-pulse"),
    repo: gh("khabar-pulse"),
    health: "https://khabar-pulse-api.sabin-apps.workers.dev/api/health",
    shot: "shots/khabar-pulse.webp",
    accent: "#DC143C",
    syncId: "khabar-pulse",
    featured: true,
  },
  {
    id: "weather",
    name: "Weather",
    category: "News & Weather",
    tagline: "A living sky, rain alerts by the minute and a 24-hour scrubber.",
    edge: "Apple Weather polish with AccuWeather-style nowcasts, free and instant.",
    platforms: ["Web"],
    url: pages("weather-dashboard-web"),
    repo: gh("weather-dashboard-web"),
    health: pages("weather-dashboard-web"),
    shot: "shots/weather-dashboard.webp",
    accent: "#3B82F6",
    syncId: "weather-dashboard-web",
  },
  {
    id: "todo",
    name: "Todo",
    category: "Productivity",
    tagline: "Tasks with XP, streaks, focus sessions and plain-English quick add.",
    edge: "Natural-language input and Pomodoro for free, which Todoist and TickTick charge for or lack.",
    platforms: ["Web"],
    url: pages("todo-web"),
    repo: gh("todo-web"),
    health: pages("todo-web"),
    shot: "shots/todo.webp",
    accent: "#7C5CFF",
    syncId: "todo-web",
  },
  {
    id: "notes",
    name: "Notes",
    category: "Productivity",
    tagline: "Colourful notes and checklists with app lock.",
    edge: "Keep-style speed with a writing streak and on-device privacy.",
    platforms: ["Android"],
    repo: gh("notes-android"),
    accent: "#F59E0B",
  },
  {
    id: "sync-api",
    name: "Sabin Labs Sync",
    category: "Developer platform",
    tagline: "End-to-end encrypted sync behind every app. No passwords.",
    edge: "The server stores only ciphertext; one code links all your devices.",
    platforms: ["API"],
    url: "https://sync-api.sabin-apps.workers.dev/v1/health",
    repo: gh("sync-api"),
    health: "https://sync-api.sabin-apps.workers.dev/v1/health",
    accent: "#7CC4FF",
  },
  {
    id: "inventory",
    name: "Inventory API",
    category: "Developer platform",
    tagline: "Stock, movements and low-stock alerts for small shops.",
    edge: "Foundation for a Nepal shop ledger, the model Vyapar and Khatabook proved in India.",
    platforms: ["API"],
    url: "https://inventory-api-tagg.onrender.com/",
    repo: gh("inventory-api-node"),
    health: "https://inventory-api-tagg.onrender.com/health",
    accent: "#A3E635",
  },
  {
    id: "bookstore",
    name: "Bookstore API",
    category: "Developer platform",
    tagline: "Books, reviews and similar titles with a live explorer.",
    edge: "A FastAPI reference service with an interactive playground.",
    platforms: ["API"],
    url: "https://bookstore-api-lhpl.onrender.com/",
    repo: gh("bookstore-api-python"),
    health: "https://bookstore-api-lhpl.onrender.com/health",
    accent: "#FB7185",
  },
  {
    id: "house-price",
    name: "House Price ML",
    category: "Developer platform",
    tagline: "Price predictions with honest ranges and explanations.",
    edge: "Prediction intervals and factor explanations, like Zillow's Zestimate ranges.",
    platforms: ["API"],
    repo: gh("house-price-ml"),
    accent: "#C084FC",
  },
];

export const CATEGORIES: Category[] = ["Games", "Money", "News & Weather", "Productivity", "Developer platform"];

export function byCategory(products: Product[] = PRODUCTS): Map<Category, Product[]> {
  const map = new Map<Category, Product[]>(CATEGORIES.map((c) => [c, []]));
  for (const p of products) map.get(p.category)!.push(p);
  return map;
}

export const SYNC_APPS = PRODUCTS.filter((p) => p.syncId);

export const STATS = [
  { value: 15, label: "products" },
  { value: 16, label: "repos with CI/CD" },
  { value: 1560, label: "automated tests" },
  { value: 24, label: "hours a day the AI engineer works", suffix: "/7" },
] as const;
