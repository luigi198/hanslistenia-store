/** Cache tags for public catalog data; admin edits update them immediately. */
export const CATALOG_TAG = "catalog";

export function productTag(slug: string): string {
  return `product:${slug}`;
}
