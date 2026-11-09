import { describe, expect, it } from "vitest";
import type { ImageStorage } from "@/domain/ports/image-storage";
import {
  SlugTakenError,
  type NewProduct,
  type ProductChanges,
  type ProductRepository,
} from "@/domain/ports/product-repository";
import { createLogger } from "@/shared/logger";
import { MAX_IMAGE_BYTES, type Product, type ProductDraft } from "./product";
import { ProductService } from "./product-service";

const IMG_A = "products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b6c.jpg";
const IMG_B = "products/1c7a2d0f-6b8e-4d4f-8a3b-2e3f4a5b6c7d.png";

class InMemoryProducts implements ProductRepository {
  readonly rows = new Map<string, Product>();
  private nextId = 1;
  /** Simulates another request taking these slugs between check and insert. */
  raceSlugs = new Set<string>();

  async insert(input: NewProduct) {
    if (this.raceSlugs.delete(input.slug)) throw new SlugTakenError(input.slug);
    if ([...this.rows.values()].some((p) => p.slug === input.slug)) {
      throw new SlugTakenError(input.slug);
    }
    const product = { ...input, id: String(this.nextId++) };
    this.rows.set(product.id, product);
    return product;
  }
  async update(id: string, changes: ProductChanges) {
    const current = this.rows.get(id);
    if (!current) return null;
    const next = { ...current, ...changes };
    this.rows.set(id, next);
    return next;
  }
  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }
  async findBySlug(slug: string) {
    return [...this.rows.values()].find((p) => p.slug === slug) ?? null;
  }
  async list({ activeOnly }: { activeOnly: boolean }) {
    return [...this.rows.values()]
      .filter((p) => !activeOnly || p.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async slugExists(slug: string) {
    return [...this.rows.values()].some((p) => p.slug === slug);
  }
}

class FakeImageStorage implements ImageStorage {
  readonly deleted: string[] = [];
  failDeletes = false;
  async createUploadUrl(key: string, contentType: string, bytes: number) {
    return `https://upload.test/${key}?type=${contentType}&bytes=${bytes}`;
  }
  publicUrl(key: string) {
    return `https://cdn.test/${key}`;
  }
  async delete(keys: string[]) {
    if (this.failDeletes) throw new Error("s3 down");
    this.deleted.push(...keys);
  }
}

const draft = (over: Partial<ProductDraft> = {}): ProductDraft => ({
  name: "Camiseta Básica",
  description: "Algodón.",
  basePrice: 12_000,
  productionNote: null,
  optionGroups: [{ name: "Talla", values: [{ label: "S", priceDelta: 0 }] }],
  images: [],
  ...over,
});

function setup() {
  const products = new InMemoryProducts();
  const images = new FakeImageStorage();
  const lines: string[] = [];
  let clock = new Date("2026-11-08T12:00:00Z").getTime();
  const service = new ProductService({
    products,
    images,
    logger: createLogger({ level: "debug", write: (l) => lines.push(l) }),
    now: () => new Date((clock += 1000)),
  });
  return { service, products, images, lines };
}

async function created(service: ProductService, d = draft()) {
  const result = await service.create(d);
  if (!result.ok) throw new Error(`create failed: ${JSON.stringify(result)}`);
  return result.product;
}

describe("ProductService.create", () => {
  it("stores a valid product as active, with a slug from its name", async () => {
    const { service } = setup();
    const product = await created(service);
    expect(product).toMatchObject({
      slug: "camiseta-basica",
      active: true,
      basePrice: 12_000,
    });
    expect(await service.getActiveBySlug("camiseta-basica")).toEqual(product);
  });

  it("gives products with the same name unique slugs", async () => {
    const { service } = setup();
    const slugs = [];
    for (let i = 0; i < 3; i++) slugs.push((await created(service)).slug);
    expect(slugs).toEqual([
      "camiseta-basica",
      "camiseta-basica-2",
      "camiseta-basica-3",
    ]);
  });

  it("retries with the next slug if another request takes it first", async () => {
    const { service, products } = setup();
    products.raceSlugs.add("camiseta-basica");
    expect((await created(service)).slug).toBe("camiseta-basica-2");
  });

  it("rejects an invalid product and stores nothing", async () => {
    const { service, products } = setup();
    const result = await service.create(draft({ name: " ", basePrice: 0 }));
    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== "invalid")
      throw new Error("expected invalid");
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["name_required", "price_invalid"]),
    );
    expect(products.rows.size).toBe(0);
  });
});

describe("ProductService.update", () => {
  it("keeps the slug when the product is renamed", async () => {
    const { service } = setup();
    const { id } = await created(service);
    const result = await service.update(id, draft({ name: "Camiseta Pro" }));
    expect(result).toMatchObject({
      ok: true,
      product: { name: "Camiseta Pro", slug: "camiseta-basica" },
    });
  });

  it("reports an unknown product", async () => {
    const { service } = setup();
    await expect(service.update("nope", draft())).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("rejects invalid changes and leaves the product as it was", async () => {
    const { service } = setup();
    const before = await created(service);
    const result = await service.update(before.id, draft({ basePrice: -5 }));
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(await service.getById(before.id)).toEqual(before);
  });

  it("deletes photos that were removed from storage", async () => {
    const { service, images } = setup();
    const { id } = await created(
      service,
      draft({ images: [{ key: IMG_A }, { key: IMG_B }] }),
    );
    await service.update(id, draft({ images: [{ key: IMG_B }] }));
    expect(images.deleted).toEqual([IMG_A]);
  });

  it("still saves when removed photos can't be deleted, and logs it", async () => {
    const { service, images, lines } = setup();
    const { id } = await created(service, draft({ images: [{ key: IMG_A }] }));
    images.failDeletes = true;
    const result = await service.update(id, draft({ images: [] }));
    expect(result.ok).toBe(true);
    expect(lines.join("\n")).toContain("product_image_delete_failed");
  });
});

describe("visibility", () => {
  it("hides a product from the public catalog but keeps it for the admin", async () => {
    const { service } = setup();
    const shown = await created(service, draft({ name: "Visible" }));
    const hidden = await created(service, draft({ name: "Oculto" }));
    await service.setActive(hidden.id, false);

    expect((await service.listActive()).map((p) => p.id)).toEqual([shown.id]);
    expect(await service.getActiveBySlug(hidden.slug)).toBeNull();
    expect((await service.listAll()).map((p) => p.id)).toEqual([
      hidden.id,
      shown.id,
    ]);

    await service.setActive(hidden.id, true);
    expect(await service.getActiveBySlug(hidden.slug)).not.toBeNull();
  });

  it("returns null when hiding an unknown product", async () => {
    const { service } = setup();
    await expect(service.setActive("nope", false)).resolves.toBeNull();
  });
});

describe("ProductService.requestImageUpload", () => {
  it("returns a new product image key and an upload URL bound to type and size", async () => {
    const { service } = setup();
    const result = await service.requestImageUpload({
      contentType: "image/webp",
      bytes: 2_000_000,
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.key).toMatch(/^products\/[0-9a-f-]{36}\.webp$/);
    expect(result.uploadUrl).toBe(
      `https://upload.test/${result.key}?type=image/webp&bytes=2000000`,
    );
    expect(result.publicUrl).toBe(`https://cdn.test/${result.key}`);
  });

  it.each([
    [{ contentType: "image/gif", bytes: 1000 }, "unsupported_type"],
    [{ contentType: "application/pdf", bytes: 1000 }, "unsupported_type"],
    [{ contentType: "image/jpeg", bytes: MAX_IMAGE_BYTES + 1 }, "invalid_size"],
    [{ contentType: "image/jpeg", bytes: 0 }, "invalid_size"],
  ])("rejects %j", async (input, reason) => {
    const { service } = setup();
    await expect(service.requestImageUpload(input)).resolves.toEqual({
      ok: false,
      reason,
    });
  });
});
