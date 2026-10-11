/** Mirrors the system colour scheme onto <html data-theme>, which the CSS tokens and the WebGL hero read. */
export function resolveTheme(prefersLight: boolean): "light" | "dark" {
  return prefersLight ? "light" : "dark";
}

export function syncTheme(): void {
  if (typeof matchMedia !== "function") return;
  const mq = matchMedia("(prefers-color-scheme: light)");
  const apply = () => document.documentElement.setAttribute("data-theme", resolveTheme(mq.matches));
  apply();
  mq.addEventListener?.("change", apply);
}
