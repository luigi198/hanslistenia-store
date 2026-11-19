import type { MetadataRoute } from "next";
import { getCatalog } from "./(tienda)/productos/_lib/catalog";
import { absoluteUrl } from "./_lib/site";
import { COACH_PATH, productPath } from "./_lib/structured-data";

/** Public, indexable pages. Admin and order pages never belong here. */
const STATIC_PATHS = ["/", "/productos", COACH_PATH, "/entrenamientos"];

// The catalog read is cached and refreshed by admin edits, so new or edited
// products show up here without a redeploy.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();
  return [
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...products.map((product) => ({
      url: absoluteUrl(productPath(product.slug)),
      lastModified: product.updatedAt,
      ...(product.coverUrl && { images: [product.coverUrl] }),
    })),
  ];
}
