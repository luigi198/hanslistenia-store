import type { Product, ProductDraft } from "@/domain/products/product";

// Re-exported so storage/ can type rows while importing only from ports.
export type { Product, ProductDraft };

export type NewProduct = Omit<Product, "id">;
export type ProductChanges = Partial<ProductDraft & { active: boolean }> & {
  updatedAt: Date;
};

/** Another product already has this slug (enforced by a unique index). */
export class SlugTakenError extends Error {
  constructor(readonly slug: string) {
    super(`Slug already taken: ${slug}`);
    this.name = "SlugTakenError";
  }
}

export interface ProductRepository {
  /** @throws SlugTakenError when the slug is not unique. */
  insert(product: NewProduct): Promise<Product>;
  /** The updated product, or null if no product has this id. */
  update(id: string, changes: ProductChanges): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  /** Newest first. */
  list(filter: { activeOnly: boolean }): Promise<Product[]>;
  slugExists(slug: string): Promise<boolean>;
}
