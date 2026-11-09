import { stripDiacritics } from "@/shared/text";

const MAX_SLUG_LENGTH = 80;
const FALLBACK_SLUG = "producto";

/** URL slug from a product name: lowercase ASCII words joined by dashes. */
export function slugify(name: string): string {
  const slug = stripDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
  return slug || FALLBACK_SLUG;
}

/** The n-th candidate for a slug: base, base-2, base-3, … */
export function slugCandidate(base: string, attempt: number): string {
  return attempt === 1 ? base : `${base}-${attempt}`;
}
