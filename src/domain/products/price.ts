import type { OptionGroup } from "./product";

/** Group name → chosen value label. */
export type OptionSelection = Readonly<Record<string, string>>;

/** The selection doesn't pick exactly one existing value per option group. */
export class InvalidSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSelectionError";
  }
}

/**
 * The label chosen for a group, or undefined. Own properties only, so a group
 * named like an Object.prototype member ("constructor") is never "chosen".
 */
export function chosenLabel(
  selection: OptionSelection,
  groupName: string,
): string | undefined {
  return Object.hasOwn(selection, groupName) ? selection[groupName] : undefined;
}

/** True when every option group has a chosen value. */
export function isSelectionComplete(
  groups: readonly OptionGroup[],
  selection: OptionSelection,
): boolean {
  return groups.every((g) => Boolean(chosenLabel(selection, g.name)));
}

/**
 * Unit price in integer colones: base price plus the delta of the value
 * chosen in every option group. Pure, so the product page can show it live
 * and checkout can recompute it server-side.
 */
export function computeUnitPrice(
  product: { basePrice: number; optionGroups: readonly OptionGroup[] },
  selection: OptionSelection,
): number {
  const groupNames = new Set(product.optionGroups.map((g) => g.name));
  for (const name of Object.keys(selection)) {
    if (!groupNames.has(name)) {
      throw new InvalidSelectionError(`Unknown option group: ${name}`);
    }
  }
  return product.optionGroups.reduce((total, group) => {
    const label = chosenLabel(selection, group.name);
    const chosen = group.values.find((v) => v.label === label);
    if (!chosen) {
      throw new InvalidSelectionError(`No valid value for: ${group.name}`);
    }
    return total + chosen.priceDelta;
  }, product.basePrice);
}

/** Lowest possible unit price ("desde ₡…"): cheapest value in every group. */
export function minUnitPrice(product: {
  basePrice: number;
  optionGroups: readonly OptionGroup[];
}): number {
  return product.optionGroups.reduce(
    (total, group) =>
      total + Math.min(...group.values.map((v) => v.priceDelta)),
    product.basePrice,
  );
}
