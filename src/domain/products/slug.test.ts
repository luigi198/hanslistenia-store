import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["Camiseta Básica", "camiseta-basica"],
    ["  Sudadera   con capucha  ", "sudadera-con-capucha"],
    ["Pantalón ÑANDÚ 2.0!", "pantalon-nandu-2-0"],
    ["--Top--Deportivo--", "top-deportivo"],
    ["Ünïcödé çàfé", "unicode-cafe"],
  ])("%j → %j", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("falls back to 'producto' when nothing usable is left", () => {
    expect(slugify("¡¿!?")).toBe("producto");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = slugify(`${"palabra ".repeat(30)}`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
