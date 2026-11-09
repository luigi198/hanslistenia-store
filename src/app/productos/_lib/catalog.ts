import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG, productTag } from "@/app/_lib/cache-tags";
import { getProductService } from "@/composition/products";
import type { OptionGroup } from "@/domain/products/product";
import { minUnitPrice } from "@/domain/products/price";

// Public catalog reads, cached across requests and refreshed by admin edits
// through updateTag (see app/admin/productos/actions.ts). Only active
// products and only display fields leave this module.

export interface CatalogItem {
  slug: string;
  name: string;
  fromPrice: number;
  hasOptions: boolean;
  coverUrl: string | null;
}

export interface PublicProduct {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  fromPrice: number;
  productionNote: string | null;
  optionGroups: OptionGroup[];
  imageUrls: string[];
}

export async function getCatalog(): Promise<CatalogItem[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const service = getProductService();
  const products = await service.listActive();
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    fromPrice: minUnitPrice(p),
    hasOptions: p.optionGroups.length > 0,
    coverUrl: p.images[0] ? service.imageUrl(p.images[0].key) : null,
  }));
}

export async function getPublicProduct(
  slug: string,
): Promise<PublicProduct | null> {
  "use cache";
  cacheTag(productTag(slug));
  cacheLife("hours");
  const service = getProductService();
  const product = await service.getActiveBySlug(slug);
  if (!product) return null;
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    fromPrice: minUnitPrice(product),
    productionNote: product.productionNote,
    optionGroups: product.optionGroups,
    imageUrls: product.images.map((i) => service.imageUrl(i.key)),
  };
}
