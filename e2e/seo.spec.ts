import { expect, type Page, test } from "@playwright/test";
import { MongoClient, type ObjectId } from "mongodb";
import { e2eMongo } from "../test-support/mongo-container";
import { logIn } from "./helpers";

// One worker for this file: the seeded product is shared by its tests.
test.describe.configure({ mode: "default" });
// Own client IP so admin login rate-limit state never leaks between tests.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.40" } });

const SITE = "https://hanslistenia.com";
const E2E_DB = "hanslistenia_e2e";
const MAX_TITLE = 60;
const MIN_DESCRIPTION = 50;
const MAX_DESCRIPTION = 160;

const run = Date.now().toString(36);
const slug = `seo-e2e-${run}`;
const longWord = "calistenia ".repeat(30);
let productId: ObjectId;

test.beforeAll(async () => {
  const client = new MongoClient(e2eMongo.uri);
  try {
    const now = new Date();
    productId = (
      await client
        .db(E2E_DB)
        .collection("products")
        .insertOne({
          name: `Camiseta SEO ${run}`,
          slug,
          description: `Camiseta <b>de prueba</b>.\n\n${longWord}`,
          basePrice: 15_000,
          productionNote: null,
          optionGroups: [
            {
              name: "Talla",
              values: [
                { label: "M", priceDelta: 0 },
                { label: "XXL", priceDelta: 2_000 },
              ],
            },
          ],
          images: [{ key: `products/${slug}-1.jpg` }],
          active: true,
          createdAt: now,
          updatedAt: now,
        })
    ).insertedId;
  } finally {
    await client.close();
  }
});

test.afterAll(async () => {
  const client = new MongoClient(e2eMongo.uri);
  try {
    await client
      .db(E2E_DB)
      .collection("products")
      .deleteOne({ _id: productId });
  } finally {
    await client.close();
  }
});

async function head(page: Page) {
  return page.evaluate(() => {
    const attr = (selector: string, name: string) =>
      document.querySelector(selector)?.getAttribute(name) ?? null;
    return {
      title: document.title,
      description: attr('meta[name="description"]', "content"),
      canonical: attr('link[rel="canonical"]', "href"),
      ogUrl: attr('meta[property="og:url"]', "content"),
      ogImage: attr('meta[property="og:image"]', "content"),
      ogLocale: attr('meta[property="og:locale"]', "content"),
      ogSiteName: attr('meta[property="og:site_name"]', "content"),
      twitterCard: attr('meta[name="twitter:card"]', "content"),
      robots: attr('meta[name="robots"]', "content"),
    };
  });
}

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

const PAGES = [
  { path: "/", type: ["Organization", "WebSite"] },
  { path: "/productos", type: [] },
  { path: "/sobre-el-coach", type: ["ProfilePage"] },
  { path: "/entrenamientos", type: ["VideoObject"] },
  { path: "/productos/<producto>", type: ["Product", "BreadcrumbList"] },
];

/** The seeded product's slug is per run, so titles use a placeholder. */
const realPath = (path: string) => path.replace("<producto>", slug);

/** Next writes the home canonical without its trailing slash. */
const canonicalOf = (path: string) =>
  path === "/" ? SITE : new URL(path, SITE).href;

for (const { path: titlePath, type } of PAGES) {
  test(`${titlePath} has complete, indexable SEO metadata`, async ({
    page,
    request,
  }) => {
    const path = realPath(titlePath);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const meta = await head(page);

    expect(meta.title.length).toBeLessThanOrEqual(MAX_TITLE);
    expect(meta.title).not.toMatch(/Hanslistenia.*Hanslistenia/);
    expect(meta.description?.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION);
    expect(meta.description?.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(meta.canonical).toBe(canonicalOf(path));
    expect(meta.ogUrl).toBe(meta.canonical);
    expect(meta.ogImage).toMatch(/^https?:\/\//);
    // Images on our own origin must exist (product photos live on S3).
    if (meta.ogImage?.startsWith(SITE)) {
      const image = await request.get(meta.ogImage.slice(SITE.length));
      expect(image.status()).toBe(200);
    }
    expect(meta.ogLocale).toBe("es_CR");
    expect(meta.ogSiteName).toBe("Hanslistenia");
    expect(meta.twitterCard).toBe("summary_large_image");
    expect(meta.robots).toBeNull();

    const types = (await jsonLd(page)).map((block) => block["@type"]);
    expect(types).toEqual(type);
  });
}

test("the default share image is served", async ({ request }) => {
  const response = await request.get("/og/hanslistenia.jpg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
});

test("the organization logo is served", async ({ request }) => {
  const response = await request.get("/apple-icon.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});

test("a product's description is a clean summary and its offer a price range", async ({
  page,
}) => {
  await page.goto(`/productos/${slug}`);
  const meta = await head(page);
  expect(meta.description).not.toContain("\n");
  expect(meta.description?.endsWith("…")).toBe(true);
  expect(meta.ogImage).toContain(`products/${slug}-1.jpg`);

  const [product] = await jsonLd(page);
  expect(product.offers).toMatchObject({
    "@type": "AggregateOffer",
    lowPrice: 15_000,
    highPrice: 17_000,
    priceCurrency: "CRC",
  });
  // The raw markup in the description must not reach the page's HTML.
  const html = await page.content();
  expect(html).not.toContain("<b>de prueba</b>");
});

test("robots.txt allows crawling and points to the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("User-Agent: *");
  expect(body).toContain("Allow: /");
  expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test("the sitemap lists public pages, and a product as soon as the admin saves it", async ({
  page,
  request,
}) => {
  const name = `Sitemap E2E ${run}`;
  const savedSlug = `sitemap-e2e-${run}`;
  await logIn(page);
  await page.goto("/admin/productos/nuevo");
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Descripción").fill("Producto para el sitemap.");
  await page.getByLabel("Precio base (₡)").fill("12000");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page).toHaveURL("/admin/productos");

  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const path of [
    "/",
    "/productos",
    "/sobre-el-coach",
    "/entrenamientos",
    `/productos/${savedSlug}`,
  ]) {
    expect(body).toContain(`<loc>${new URL(path, SITE).href}</loc>`);
  }
  expect(body).not.toContain("/admin");
  expect(body).not.toContain("/pedido");
});

test("a missing page is a noindex 404 with its own title", async ({ page }) => {
  const response = await page.goto("/no-existe");
  expect(response?.status()).toBe(404);
  const meta = await head(page);
  expect(meta.title).toBe("Página no encontrada | Hanslistenia");
  expect(meta.robots).toContain("noindex");
});

test("order pages are never indexed", async ({ request }) => {
  const response = await request.get("/pedido/cualquier-token");
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
