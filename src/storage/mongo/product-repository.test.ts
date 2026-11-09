import { randomUUID } from "node:crypto";
import { MongoClient, type Db } from "mongodb";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import {
  SlugTakenError,
  type NewProduct,
} from "@/domain/ports/product-repository";
import { MongoProductRepository } from "./product-repository";

const T0 = new Date("2026-11-08T12:00:00Z");

const newProduct = (slug: string, over: Partial<NewProduct> = {}) => ({
  name: `Producto ${slug}`,
  description: "Desc",
  basePrice: 10_000,
  productionNote: null,
  optionGroups: [{ name: "Talla", values: [{ label: "M", priceDelta: 500 }] }],
  images: [{ key: "products/a.jpg" }],
  slug,
  active: true,
  createdAt: T0,
  updatedAt: T0,
  ...over,
});

describe("MongoProductRepository (integration)", () => {
  let client: MongoClient;
  let db: Db;
  let repo: MongoProductRepository;

  beforeAll(async () => {
    client = await new MongoClient(inject("mongoUri")).connect();
    db = client.db(`hl_test_${randomUUID().slice(0, 8)}`);
    repo = new MongoProductRepository(async () => db);
  });

  afterAll(async () => {
    await db?.dropDatabase();
    await client?.close();
  });

  it("round-trips a product with a string id", async () => {
    const saved = await repo.insert(newProduct("camiseta"));
    expect(saved.id).toMatch(/^[0-9a-f]{24}$/);
    expect(await repo.findById(saved.id)).toEqual(saved);
    expect(await repo.findBySlug("camiseta")).toEqual(saved);
    expect(await repo.slugExists("camiseta")).toBe(true);
    expect(await repo.slugExists("otra")).toBe(false);
  });

  it("rejects a duplicate slug with SlugTakenError", async () => {
    await repo.insert(newProduct("unica"));
    await expect(repo.insert(newProduct("unica"))).rejects.toBeInstanceOf(
      SlugTakenError,
    );
  });

  it("updates only the given fields and returns the new state", async () => {
    const saved = await repo.insert(newProduct("editable"));
    const later = new Date(T0.getTime() + 1000);
    const updated = await repo.update(saved.id, {
      name: "Nuevo nombre",
      active: false,
      updatedAt: later,
    });
    expect(updated).toEqual({
      ...saved,
      name: "Nuevo nombre",
      active: false,
      updatedAt: later,
    });
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await repo.findById("000000000000000000000000")).toBeNull();
    expect(await repo.findById("not-an-id")).toBeNull();
    expect(
      await repo.update("not-an-id", { active: false, updatedAt: T0 }),
    ).toBeNull();
  });

  it("lists newest first, optionally only active products", async () => {
    const isolated = new MongoProductRepository(async () =>
      client.db(`${db.databaseName}_list`),
    );
    const at = (s: number) => new Date(T0.getTime() + s * 1000);
    await isolated.insert(newProduct("viejo", { createdAt: at(1) }));
    await isolated.insert(
      newProduct("oculto", { createdAt: at(2), active: false }),
    );
    await isolated.insert(newProduct("nuevo", { createdAt: at(3) }));

    const slugs = async (activeOnly: boolean) =>
      (await isolated.list({ activeOnly })).map((p) => p.slug);
    expect(await slugs(false)).toEqual(["nuevo", "oculto", "viejo"]);
    expect(await slugs(true)).toEqual(["nuevo", "viejo"]);
    await client.db(`${db.databaseName}_list`).dropDatabase();
  });
});
