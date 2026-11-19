import { describe, expect, it } from "vitest";
import { stripDiacritics, summarize } from "./text";

describe("stripDiacritics", () => {
  it("removes accents and keeps the base letters", () => {
    expect(stripDiacritics("Cédula Ñandú güero")).toBe("Cedula Nandu guero");
  });

  it("leaves plain text unchanged", () => {
    expect(stripDiacritics("Talla XL 2.0")).toBe("Talla XL 2.0");
  });
});

describe("summarize", () => {
  it("returns short text unchanged, with whitespace collapsed", () => {
    expect(summarize("Camiseta  de\n\nalgodón.", 160)).toBe(
      "Camiseta de algodón.",
    );
  });

  it("cuts long text at a word boundary and marks the cut", () => {
    const result = summarize("uno dos tres cuatro cinco", 14);
    expect(result).toBe("uno dos tres…");
    expect(result.length).toBeLessThanOrEqual(14);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(summarize("Hecha a pedido, en Costa Rica", 17)).toBe(
      "Hecha a pedido…",
    );
  });

  it("cuts a single over-long word when there is no space to cut at", () => {
    expect(summarize("supercalifragilístico", 8)).toBe("superca…");
  });

  it("rejects a length too small to hold any text", () => {
    expect(() => summarize("hola", 1)).toThrow(RangeError);
  });
});
