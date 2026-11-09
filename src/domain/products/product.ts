/** Product model and its business rules. Money is integer colones (CRC). */

export interface OptionValue {
  label: string;
  /** Added to the base price when chosen; integer colones, never negative. */
  priceDelta: number;
}

export interface OptionGroup {
  name: string;
  values: OptionValue[];
}

export interface ProductImage {
  /** Object key in the public products bucket. */
  key: string;
}

/** What the admin edits. */
export interface ProductDraft {
  name: string;
  description: string;
  basePrice: number;
  productionNote: string | null;
  optionGroups: OptionGroup[];
  /** In display order; the first is the cover photo. */
  images: ProductImage[];
}

export interface Product extends ProductDraft {
  id: string;
  /** From the name at creation; never changes, so shared links keep working. */
  slug: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const PRODUCT_LIMITS = {
  nameLength: 120,
  descriptionLength: 5_000,
  productionNoteLength: 300,
  minPrice: 1,
  maxPrice: 10_000_000,
  maxPriceDelta: 1_000_000,
  optionGroups: 5,
  valuesPerGroup: 30,
  optionTextLength: 60,
  images: 10,
} as const;

/** Accepted photo formats → file extension used in the storage key. */
export const PRODUCT_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
export type ProductImageType = keyof typeof PRODUCT_IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Folder of product photos in the bucket (also allowed by next/image). */
export const PRODUCT_IMAGE_PREFIX = "products/";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/** Keys this app generates: products/<uuid>.<ext>. */
export const PRODUCT_IMAGE_KEY_PATTERN = new RegExp(
  `^${PRODUCT_IMAGE_PREFIX}${UUID}\\.(${Object.values(PRODUCT_IMAGE_TYPES).join("|")})$`,
);

export function isProductImageType(type: string): type is ProductImageType {
  return Object.hasOwn(PRODUCT_IMAGE_TYPES, type);
}

export type ProductErrorCode =
  | "name_required"
  | "name_too_long"
  | "description_too_long"
  | "production_note_too_long"
  | "price_invalid"
  | "too_many_option_groups"
  | "option_group_name_required"
  | "option_group_duplicate"
  | "option_values_required"
  | "too_many_option_values"
  | "option_value_label_required"
  | "option_value_duplicate"
  | "option_text_too_long"
  | "price_delta_invalid"
  | "too_many_images"
  | "image_invalid";

export interface ProductValidationError {
  /** Dotted path of the offending field, e.g. "optionGroups.0.values.1". */
  field: string;
  code: ProductErrorCode;
}

/**
 * Trims text and turns a blank note into null. Blank option rows are kept so
 * validation reports them at the row index the admin sees.
 */
export function normalizeDraft(draft: ProductDraft): ProductDraft {
  const note = draft.productionNote?.trim() ?? "";
  return {
    ...draft,
    name: draft.name.trim(),
    description: draft.description.trim(),
    productionNote: note || null,
    optionGroups: draft.optionGroups.map((group) => ({
      name: group.name.trim(),
      values: group.values.map((v) => ({ ...v, label: v.label.trim() })),
    })),
  };
}

const inRange = (n: number, min: number, max: number) =>
  Number.isInteger(n) && n >= min && n <= max;

/** Business-rule violations of a normalized draft; empty when valid. */
export function validateDraft(draft: ProductDraft): ProductValidationError[] {
  const L = PRODUCT_LIMITS;
  const errors: ProductValidationError[] = [];
  const fail = (field: string, code: ProductErrorCode) =>
    errors.push({ field, code });

  if (!draft.name) fail("name", "name_required");
  else if (draft.name.length > L.nameLength) fail("name", "name_too_long");
  if (draft.description.length > L.descriptionLength) {
    fail("description", "description_too_long");
  }
  if ((draft.productionNote?.length ?? 0) > L.productionNoteLength) {
    fail("productionNote", "production_note_too_long");
  }
  if (!inRange(draft.basePrice, L.minPrice, L.maxPrice)) {
    fail("basePrice", "price_invalid");
  }

  validateOptionGroups(draft.optionGroups, fail);
  validateImages(draft.images, fail);
  return errors;
}

type Fail = (field: string, code: ProductErrorCode) => void;

// O(groups × values) with Set lookups for duplicates; both are small and capped.
function validateOptionGroups(groups: OptionGroup[], fail: Fail): void {
  const L = PRODUCT_LIMITS;
  if (groups.length > L.optionGroups) {
    fail("optionGroups", "too_many_option_groups");
  }
  const groupNames = new Set<string>();
  groups.forEach((group, g) => {
    const at = `optionGroups.${g}`;
    const key = group.name.toLowerCase();
    if (!group.name) fail(`${at}.name`, "option_group_name_required");
    else if (group.name.length > L.optionTextLength) {
      fail(`${at}.name`, "option_text_too_long");
    } else if (groupNames.has(key))
      fail(`${at}.name`, "option_group_duplicate");
    groupNames.add(key);

    if (group.values.length === 0) fail(at, "option_values_required");
    if (group.values.length > L.valuesPerGroup) {
      fail(at, "too_many_option_values");
    }
    const labels = new Set<string>();
    group.values.forEach((value, v) => {
      const vat = `${at}.values.${v}`;
      const label = value.label.toLowerCase();
      if (!value.label) fail(vat, "option_value_label_required");
      else if (value.label.length > L.optionTextLength) {
        fail(vat, "option_text_too_long");
      } else if (labels.has(label)) fail(vat, "option_value_duplicate");
      labels.add(label);
      if (!inRange(value.priceDelta, 0, L.maxPriceDelta)) {
        fail(vat, "price_delta_invalid");
      }
    });
  });
}

function validateImages(images: ProductImage[], fail: Fail): void {
  if (images.length > PRODUCT_LIMITS.images) fail("images", "too_many_images");
  const seen = new Set<string>();
  images.forEach((image, i) => {
    if (!PRODUCT_IMAGE_KEY_PATTERN.test(image.key) || seen.has(image.key)) {
      fail(`images.${i}`, "image_invalid");
    }
    seen.add(image.key);
  });
}
