import { expect, test } from "@playwright/test";
import { MongoClient, type ObjectId } from "mongodb";
import { e2eMongo } from "../test-support/mongo-container";

// Products are written straight to the E2E database: uploading photos needs
// S3 (see the TODO in catalog.spec.ts). The photo URLs don't resolve, which
// doesn't matter here — the test is about moving between photos.
const E2E_DB = "hanslistenia_e2e";

const run = Date.now().toString(36);
const created: ObjectId[] = [];

async function insertProduct(slug: string, photoCount: number) {
  const client = new MongoClient(e2eMongo.uri);
  try {
    const now = new Date();
    const { insertedId } = await client
      .db(E2E_DB)
      .collection("products")
      .insertOne({
        name: `Galería E2E ${slug}`,
        slug,
        description: "Producto de prueba.",
        basePrice: 10_000,
        productionNote: null,
        optionGroups: [],
        images: Array.from({ length: photoCount }, (_, i) => ({
          key: `products/${slug}-${i + 1}.jpg`,
        })),
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    created.push(insertedId);
  } finally {
    await client.close();
  }
}

test.afterAll(async () => {
  const client = new MongoClient(e2eMongo.uri);
  try {
    await client
      .db(E2E_DB)
      .collection("products")
      .deleteMany({ _id: { $in: created } });
  } finally {
    await client.close();
  }
});

test("product photos are a carousel: arrows and dots move between them", async ({
  page,
}) => {
  const slug = `galeria-e2e-${run}`;
  await insertProduct(slug, 3);
  await page.goto(`/productos/${slug}`);

  const gallery = page.getByRole("region", { name: /Fotos de/ });
  const counter = gallery.getByTestId("photo-counter");
  const previous = gallery.getByRole("button", { name: "Foto anterior" });
  const next = gallery.getByRole("button", { name: "Foto siguiente" });

  await expect(counter).toHaveText("1 / 3");
  await expect(previous).toBeDisabled();

  await next.click();
  await expect(counter).toHaveText("2 / 3");
  await expect(previous).toBeEnabled();

  await gallery.getByRole("button", { name: "Ver foto 3" }).click();
  await expect(counter).toHaveText("3 / 3");
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(counter).toHaveText("2 / 3");
});

test("a single photo shows no carousel controls", async ({ page }) => {
  const slug = `galeria-e2e-una-${run}`;
  await insertProduct(slug, 1);
  await page.goto(`/productos/${slug}`);

  const gallery = page.getByRole("region", { name: /Fotos de/ });
  await expect(gallery.getByRole("img")).toHaveCount(1);
  await expect(gallery.getByRole("button")).toHaveCount(0);
  await expect(gallery.getByTestId("photo-counter")).toHaveCount(0);
});
