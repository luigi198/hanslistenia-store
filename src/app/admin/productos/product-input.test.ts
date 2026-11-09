import { describe, expect, it } from "vitest";
import { parseProductForm } from "./product-input";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const fields = {
  name: "Camiseta",
  description: "Algodón",
  basePrice: "12000",
  productionNote: "",
  optionGroups: JSON.stringify([
    { name: "Talla", values: [{ label: "S", priceDelta: 0 }] },
  ]),
  images: JSON.stringify([{ key: "products/a.jpg" }]),
};

describe("parseProductForm", () => {
  it("turns the form into a product draft", () => {
    expect(parseProductForm(form(fields))).toEqual({
      name: "Camiseta",
      description: "Algodón",
      basePrice: 12_000,
      productionNote: "",
      optionGroups: [
        { name: "Talla", values: [{ label: "S", priceDelta: 0 }] },
      ],
      images: [{ key: "products/a.jpg" }],
    });
  });

  it("normalizes CRLF line endings from the textarea to LF", () => {
    const draft = parseProductForm(
      form({ ...fields, description: "Uno.\r\n\r\nDos.\rTres." }),
    );
    expect(draft?.description).toBe("Uno.\n\nDos.\nTres.");
  });

  it("keeps an unparseable price as NaN so the domain reports it", () => {
    const draft = parseProductForm(form({ ...fields, basePrice: "abc" }));
    expect(draft?.basePrice).toBeNaN();
  });

  it.each([
    ["missing name", { name: undefined }],
    ["malformed option JSON", { optionGroups: "{not json" }],
    ["wrong option shape", { optionGroups: JSON.stringify([{ name: 1 }]) }],
    ["wrong image shape", { images: JSON.stringify(["x"]) }],
    ["oversized text", { description: "x".repeat(20_001) }],
  ])("rejects a structurally invalid form: %s", (_label, change) => {
    const merged: Record<string, string> = { ...fields };
    for (const [k, v] of Object.entries(change)) {
      if (v === undefined) delete merged[k];
      else merged[k] = v;
    }
    expect(parseProductForm(form(merged))).toBeNull();
  });
});
