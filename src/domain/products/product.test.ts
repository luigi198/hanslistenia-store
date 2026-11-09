import { describe, expect, it } from "vitest";
import { normalizeDraft, validateDraft, type ProductDraft } from "./product";

const valid: ProductDraft = {
  name: "Camiseta Básica",
  description: "Algodón, hecha a pedido.",
  basePrice: 12_000,
  productionNote: "Lista en 2 semanas",
  optionGroups: [
    {
      name: "Talla",
      values: [
        { label: "S", priceDelta: 0 },
        { label: "XL", priceDelta: 2_000 },
      ],
    },
  ],
  images: [{ key: "products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b6c.jpg" }],
};

const codes = (draft: ProductDraft) => validateDraft(draft).map((e) => e.code);

describe("normalizeDraft", () => {
  it("trims text and turns a blank production note into null", () => {
    const draft = normalizeDraft({
      ...valid,
      name: "  Camiseta  ",
      productionNote: "   ",
      optionGroups: [
        {
          name: " Talla ",
          values: [
            { label: " M ", priceDelta: 0 },
            { label: "  ", priceDelta: 0 },
          ],
        },
      ],
    });
    expect(draft.name).toBe("Camiseta");
    expect(draft.productionNote).toBeNull();
    expect(draft.optionGroups).toEqual([
      {
        name: "Talla",
        values: [
          { label: "M", priceDelta: 0 },
          { label: "", priceDelta: 0 },
        ],
      },
    ]);
  });
});

describe("validateDraft", () => {
  it("flags a blank option value at the row the admin sees", () => {
    const errors = validateDraft(
      normalizeDraft({
        ...valid,
        optionGroups: [
          {
            name: "Talla",
            values: [
              { label: "S", priceDelta: 0 },
              { label: " ", priceDelta: 500 },
              { label: "M", priceDelta: 0 },
              { label: "m", priceDelta: 0 },
            ],
          },
        ],
      }),
    );
    expect(errors).toEqual([
      { field: "optionGroups.0.values.1", code: "option_value_label_required" },
      { field: "optionGroups.0.values.3", code: "option_value_duplicate" },
    ]);
  });

  it("accepts a valid product", () => {
    expect(validateDraft(valid)).toEqual([]);
  });

  it("accepts a product with no options and no images", () => {
    expect(validateDraft({ ...valid, optionGroups: [], images: [] })).toEqual(
      [],
    );
  });

  it.each<[string, Partial<ProductDraft>, string]>([
    ["empty name", { name: "" }, "name_required"],
    ["long name", { name: "x".repeat(121) }, "name_too_long"],
    [
      "long description",
      { description: "x".repeat(5001) },
      "description_too_long",
    ],
    [
      "long note",
      { productionNote: "x".repeat(301) },
      "production_note_too_long",
    ],
    ["fractional price", { basePrice: 12_000.5 }, "price_invalid"],
    ["zero price", { basePrice: 0 }, "price_invalid"],
    ["huge price", { basePrice: 10_000_001 }, "price_invalid"],
    [
      "unnamed group",
      { optionGroups: [{ name: "", values: [{ label: "S", priceDelta: 0 }] }] },
      "option_group_name_required",
    ],
    [
      "group without values",
      { optionGroups: [{ name: "Talla", values: [] }] },
      "option_values_required",
    ],
    [
      "duplicate group",
      {
        optionGroups: [
          { name: "Talla", values: [{ label: "S", priceDelta: 0 }] },
          { name: "talla", values: [{ label: "M", priceDelta: 0 }] },
        ],
      },
      "option_group_duplicate",
    ],
    [
      "duplicate value",
      {
        optionGroups: [
          {
            name: "Talla",
            values: [
              { label: "S", priceDelta: 0 },
              { label: "s", priceDelta: 0 },
            ],
          },
        ],
      },
      "option_value_duplicate",
    ],
    [
      "negative delta",
      {
        optionGroups: [
          { name: "Talla", values: [{ label: "S", priceDelta: -1 }] },
        ],
      },
      "price_delta_invalid",
    ],
    [
      "fractional delta",
      {
        optionGroups: [
          { name: "Talla", values: [{ label: "S", priceDelta: 0.5 }] },
        ],
      },
      "price_delta_invalid",
    ],
    [
      "too many images",
      {
        images: Array.from({ length: 11 }, (_, i) => ({
          key: `products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b${String(i).padStart(2, "0")}.jpg`,
        })),
      },
      "too_many_images",
    ],
    [
      "foreign image key",
      { images: [{ key: "receipts/x.jpg" }] },
      "image_invalid",
    ],
    [
      "duplicate image",
      {
        images: [
          { key: "products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b6c.jpg" },
          { key: "products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b6c.jpg" },
        ],
      },
      "image_invalid",
    ],
  ])("rejects a %s", (_label, change, code) => {
    expect(codes({ ...valid, ...change })).toContain(code);
  });
});
