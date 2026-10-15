import { render, screen } from "@testing-library/react";
import App, { parseProductHash } from "./App";
import { PRODUCTS } from "./catalog";

describe("product deep links", () => {
  it("parses #product/<id> case-insensitively", () => {
    expect(parseProductHash("#product/block-drop")).toBe("block-drop");
    expect(parseProductHash("#/product/ludo-live")).toBe("ludo-live");
    expect(parseProductHash("#product/Prism-Pop")).toBe("prism-pop");
  });

  it("rejects unrelated or malformed hashes", () => {
    expect(parseProductHash("#products")).toBeNull();
    expect(parseProductHash("#account")).toBeNull();
    expect(parseProductHash("#product/")).toBeNull();
    expect(parseProductHash("#product/block drop")).toBeNull();
    expect(parseProductHash("")).toBeNull();
  });

  it("every product id round-trips through the hash parser", () => {
    for (const p of PRODUCTS) {
      expect(parseProductHash(`#/product/${p.id}`)).toBe(p.id);
    }
  });
});

describe("site with product hash", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
    Element.prototype.scrollIntoView = vi.fn();
    window.history.replaceState(null, "", "#/product/ludo-live");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "#");
  });

  it("focuses the card named by the hash", () => {
    render(<App />);
    const card = document.getElementById("product-ludo-live");
    expect(card).not.toBeNull();
    expect(card!.className).toContain("card--focused");
    const other = document.getElementById("product-block-drop");
    expect(other!.className).not.toContain("card--focused");
  });

  it("adds a focus link on every card", () => {
    render(<App />);
    expect(screen.getAllByRole("link", { name: /^Focus / }).length).toBeGreaterThanOrEqual(PRODUCTS.length);
  });
});
