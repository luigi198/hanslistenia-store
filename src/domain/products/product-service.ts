import { randomUUID } from "node:crypto";
import type { ImageStorage } from "@/domain/ports/image-storage";
import {
  SlugTakenError,
  type ProductRepository,
} from "@/domain/ports/product-repository";
import type { Logger } from "@/shared/logger";
import {
  isProductImageType,
  MAX_IMAGE_BYTES,
  normalizeDraft,
  PRODUCT_IMAGE_PREFIX,
  PRODUCT_IMAGE_TYPES,
  validateDraft,
  type Product,
  type ProductDraft,
  type ProductValidationError,
} from "./product";
import { slugCandidate, slugify } from "./slug";

/** Insert attempts when concurrent creates race for the same slug. */
const MAX_SLUG_RACE_RETRIES = 5;

export type SaveResult =
  | { ok: true; product: Product }
  | { ok: false; reason: "invalid"; errors: ProductValidationError[] }
  | { ok: false; reason: "not_found" };

export type ImageUploadResult =
  | { ok: true; key: string; uploadUrl: string; publicUrl: string }
  | { ok: false; reason: "unsupported_type" | "invalid_size" };

export interface ProductServiceDeps {
  products: ProductRepository;
  images: ImageStorage;
  logger: Logger;
  now?: () => Date;
}

export class ProductService {
  private readonly now: () => Date;

  constructor(private readonly deps: ProductServiceDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async create(input: ProductDraft): Promise<SaveResult> {
    const draft = normalizeDraft(input);
    const errors = validateDraft(draft);
    if (errors.length) return { ok: false, reason: "invalid", errors };

    const product = await this.insertWithUniqueSlug(draft);
    this.deps.logger.info("product_created", {
      productId: product.id,
      slug: product.slug,
    });
    return { ok: true, product };
  }

  async update(id: string, input: ProductDraft): Promise<SaveResult> {
    const current = await this.deps.products.findById(id);
    if (!current) return { ok: false, reason: "not_found" };
    const draft = normalizeDraft(input);
    const errors = validateDraft(draft);
    if (errors.length) return { ok: false, reason: "invalid", errors };

    const product = await this.deps.products.update(id, {
      ...draft,
      updatedAt: this.now(),
    });
    if (!product) return { ok: false, reason: "not_found" };
    this.deps.logger.info("product_updated", { productId: id });
    await this.deleteRemovedImages(current, product);
    return { ok: true, product };
  }

  async setActive(id: string, active: boolean): Promise<Product | null> {
    const product = await this.deps.products.update(id, {
      active,
      updatedAt: this.now(),
    });
    if (product) {
      this.deps.logger.info("product_visibility_changed", {
        productId: id,
        active,
      });
    }
    return product;
  }

  getById(id: string): Promise<Product | null> {
    return this.deps.products.findById(id);
  }

  listAll(): Promise<Product[]> {
    return this.deps.products.list({ activeOnly: false });
  }

  listActive(): Promise<Product[]> {
    return this.deps.products.list({ activeOnly: true });
  }

  async getActiveBySlug(slug: string): Promise<Product | null> {
    const product = await this.deps.products.findBySlug(slug);
    return product?.active ? product : null;
  }

  async requestImageUpload(file: {
    contentType: string;
    bytes: number;
  }): Promise<ImageUploadResult> {
    if (!isProductImageType(file.contentType)) {
      return { ok: false, reason: "unsupported_type" };
    }
    const extension = PRODUCT_IMAGE_TYPES[file.contentType];
    if (!Number.isInteger(file.bytes) || file.bytes < 1) {
      return { ok: false, reason: "invalid_size" };
    }
    if (file.bytes > MAX_IMAGE_BYTES) {
      return { ok: false, reason: "invalid_size" };
    }
    const key = `${PRODUCT_IMAGE_PREFIX}${randomUUID()}.${extension}`;
    const uploadUrl = await this.deps.images.createUploadUrl(
      key,
      file.contentType,
      file.bytes,
    );
    return { ok: true, key, uploadUrl, publicUrl: this.imageUrl(key) };
  }

  imageUrl(key: string): string {
    return this.deps.images.publicUrl(key);
  }

  private async insertWithUniqueSlug(draft: ProductDraft): Promise<Product> {
    const base = slugify(draft.name);
    const now = this.now();
    let attempt = 1;
    for (let race = 0; ; race++) {
      while (
        await this.deps.products.slugExists(slugCandidate(base, attempt))
      ) {
        attempt++;
      }
      try {
        return await this.deps.products.insert({
          ...draft,
          slug: slugCandidate(base, attempt),
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        // Another request took the slug between the check and the insert.
        if (
          !(error instanceof SlugTakenError) ||
          race >= MAX_SLUG_RACE_RETRIES
        ) {
          throw error;
        }
        attempt++;
      }
    }
  }

  /** Best effort: a failed delete leaves an orphan file, never a failed save. */
  private async deleteRemovedImages(before: Product, after: Product) {
    const kept = new Set(after.images.map((i) => i.key));
    const removed = before.images.map((i) => i.key).filter((k) => !kept.has(k));
    if (!removed.length) return;
    try {
      await this.deps.images.delete(removed);
    } catch (error) {
      this.deps.logger.warn("product_image_delete_failed", {
        productId: after.id,
        keys: removed,
        error,
      });
    }
  }
}
