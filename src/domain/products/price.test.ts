import { describe, expect, it } from "vitest";
import {
  computeUnitPrice,
  InvalidSelectionError,
  isSelectionComplete,
  minUnitPrice,
} from "./price";

const product = {
  basePrice: 12_000,
  optionGroups: [
    {
      name: "Talla",
      values: [
        { label: "S", priceDelta: 0 },
        { label: "XL", priceDelta: 2_000 },
      ],
    },
    {
      name: "Color",
      values: [
        { label: "Negro", priceDelta: 0 },
        { label: "Edición especial", priceDelta: 1_500 },
      ],
    },
  ],
};

describe("computeUnitPrice", () => {
  it("adds the deltas of the selected values to the base price", () => {
    expect(
      computeUnitPrice(product, { Talla: "XL", Color: "Edición especial" }),
    ).toBe(15_500);
    expect(computeUnitPrice(product, { Talla: "S", Color: "Negro" })).toBe(
      12_000,
    );
  });

  it("is the base price for a product without options", () => {
    expect(computeUnitPrice({ basePrice: 9_000, optionGroups: [] }, {})).toBe(
      9_000,
    );
  });

  it.each([
    ["a group is missing", { Talla: "S" }],
    ["a value doesn't exist", { Talla: "XXL", Color: "Negro" }],
    ["an unknown group is given", { Talla: "S", Color: "Negro", Tela: "x" }],
  ])("rejects a selection where %s", (_label, selection) => {
    expect(() => computeUnitPrice(product, selection)).toThrow(
      InvalidSelectionError,
    );
  });
});

describe("minUnitPrice", () => {
  it("is the base price plus the cheapest value of every group", () => {
    const cheapestFirstIsNot = {
      basePrice: 10_000,
      optionGroups: [
        {
          name: "Talla",
          values: [
            { label: "XL", priceDelta: 2_000 },
            { label: "M", priceDelta: 500 },
          ],
        },
      ],
    };
    expect(minUnitPrice(cheapestFirstIsNot)).toBe(10_500);
    expect(minUnitPrice(product)).toBe(12_000);
  });
});

describe("isSelectionComplete", () => {
  it("is true only when every group has a chosen value", () => {
    expect(isSelectionComplete(product.optionGroups, { Talla: "S" })).toBe(
      false,
    );
    expect(
      isSelectionComplete(product.optionGroups, { Talla: "S", Color: "Negro" }),
    ).toBe(true);
  });

  it("is not fooled by group names that exist on Object.prototype", () => {
    const groups = [
      { name: "constructor", values: [{ label: "A", priceDelta: 0 }] },
    ];
    expect(isSelectionComplete(groups, {})).toBe(false);
    expect(() =>
      computeUnitPrice({ basePrice: 1, optionGroups: groups }, {}),
    ).toThrow(InvalidSelectionError);
  });
});
