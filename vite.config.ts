/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

/** Strict CSP, added to production builds only (the dev server injects inline scripts). */
export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; " +
  "img-src 'self' data:; connect-src 'self' https://*.sabin-apps.workers.dev https://sabin78910.github.io https://*.onrender.com; " +
  "base-uri 'self'; form-action 'self'; object-src 'none'";

const cspPlugin = (): Plugin => ({
  name: "csp-meta",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// base "./" makes the build work under any GitHub Pages sub-path.
export default defineConfig({
  base: "./",
  plugins: [react(), cspPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  },
});
