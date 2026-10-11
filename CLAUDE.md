# Sabin Labs
The company hub: product suite, Sabin Labs ID, platform story and live status.

## Stack
React 19 · TypeScript (strict) · Vite · Vitest · ESLint. Installable PWA with offline support.
Design: #07070C base, violet #7C3AED and cyan #22D3EE, Space Grotesk + Inter. Shared with portfolio-web.

## Commands
- Dev: `npm run dev` · Build: `npm run build`
- Test: `npm test` · Lint: `npm run lint && npm run typecheck`

## Architecture
- `src/catalog.ts` is the single source of truth for every product. Add new products there.
- `src/account.ts` Sabin Labs ID · `src/status.ts` health probes · `src/hero/` WebGL range

## Data rules
- The shared sync code lives in localStorage key `sabin-labs-sync-code`. Never log or transmit it.
- Health probes try CORS first, then no-cors. Keep them read only.

## Testing rules
- Every behaviour change needs a test. Pure logic in `src/*.ts` is unit-tested; components get the
  behaviour test, not the markup. Run lint, typecheck and tests before finishing.

## Frontend rules
- Keep the existing design system, dark-first with a working light theme. Editorial layouts, not dashboard
  grids. Respect `prefers-reduced-motion`, keep AA contrast and 44px targets.
- Self-host fonts with @fontsource; a Google Fonts link blocks first paint and costs ~2s on mobile.
- Keep gzipped JS under ~180KB and Lighthouse mobile performance at 90+.

## Security and git
- Never commit secrets, keystores, .env files or email addresses.
- Keep the Content-Security-Policy strict; add a host to connect-src only when a feature needs it.
- `main` is protected: branch, open a PR, merge when CI is green. One issue per PR, under ~300 lines.

## Done when
Lint clean, tests pass, CI green, PR opened with a three line summary. User facing work follows `docs/FEEL.md`.
