# Sabin Labs
Purpose: the company site and hub for every Sabin Labs product: product suite, Sabin Labs ID (shared end-to-end encrypted sync code), platform story, live status. React, TS, Vite.

## Commands
- Test: `npm test`
- Lint: `npm run lint && npm run typecheck`
- Build: `npm run build`

## Architecture
- src/catalog.ts: single source of truth for all products (add new products here).
- src/status.ts: live health probes (no-cors) and status summary. src/account.ts: Sabin Labs ID (shared localStorage key `sabin-labs-sync-code`, per-app sync state, erase).
- src/sync.ts: copied unchanged from Sabin78910/sync-api client/sync.ts.
- src/hero/: the founder particle-Himalaya hero (raw WebGL + static SVG poster), shared with portfolio-web. src/theme.ts mirrors the system theme to <html data-theme>.
- Design system = the founder site's (portfolio-web): #07070C base, violet #7C3AED, cyan #22D3EE, Space Grotesk + Inter (self-hosted). src/App.tsx: sections. CSP is added at build time in vite.config.ts.

## Rules
- Read only the files you need. Every behavior change needs a test. Run tests and lint before finishing.
- Keep the CSP strict; add hosts to connect-src only when a product needs them.
- Never log or transmit the sync code; never add email addresses or secrets to files.
- Respect reduced motion; keep AA contrast in both themes.
- Keep PRs under ~300 changed lines; one issue per PR.

## Definition of done
Lint clean, tests pass, CI green, short summary, PR opened as draft.
