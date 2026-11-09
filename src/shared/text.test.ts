import { describe, expect, it } from "vitest";
import { stripDiacritics } from "./text";

describe("stripDiacritics", () => {
  it("removes accents and keeps the base letters", () => {
    expect(stripDiacritics("Cédula Ñandú güero")).toBe("Cedula Nandu guero");
  });

  it("leaves plain text unchanged", () => {
    expect(stripDiacritics("Talla XL 2.0")).toBe("Talla XL 2.0");
  });
});
