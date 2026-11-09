import {
  MAX_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@/domain/products/product";

// User-facing wording derived from the domain's photo rules, so the picker,
// hints and error messages can never disagree with what the server accepts.
const BYTES_PER_MB = 1024 * 1024;
const extensions = Object.values(PRODUCT_IMAGE_TYPES).map((e) =>
  e.toUpperCase(),
);

/** For the file input's `accept` attribute. */
export const ACCEPTED_IMAGE_TYPES = Object.keys(PRODUCT_IMAGE_TYPES).join(",");
/** e.g. "JPG, PNG, WEBP o AVIF" */
export const IMAGE_FORMATS_LABEL = `${extensions.slice(0, -1).join(", ")} o ${extensions.at(-1)}`;
export const MAX_IMAGE_MB = MAX_IMAGE_BYTES / BYTES_PER_MB;
