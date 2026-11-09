import { expect, test } from "@playwright/test";
import { logIn } from "./helpers";

// Own client IP so rate-limit state never leaks between tests.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.30" } });

/** Exact price text, tolerating Intl's narrow no-break spaces ("₡12 000"). */
const price = (text: string) => new RegExp(`^${text.replace(/ /g, "\\s")}$`);

test("admin creates a product; visitors see it and its price follows the options", async ({
  page,
}) => {
  // TODO(photos E2E): this test deliberately skips photos. To cover them:
  //   1. Start an adobe/s3mock container next to Mongo (see
  //      test-support/mongo-container.ts for the pattern) with an initial
  //      "e2e-products" bucket, and set S3_ENDPOINT + S3_PRODUCTS_PUBLIC_URL
  //      in playwright.config.ts to point at it.
  //   2. Here, upload a small JPEG fixture via the "Agregar fotos" input,
  //      add a second one, reorder them with the arrow buttons and remove one.
  //   3. Assert the catalog card and the product page show the remaining
  //      photo as the cover (next/image src points at the s3mock URL).
  await logIn(page);
  await page.getByRole("link", { name: "Productos" }).click();
  await page.getByRole("link", { name: "Nuevo producto" }).click();

  await page.getByLabel("Nombre", { exact: true }).fill("Camiseta Básica E2E");
  await page
    .getByLabel("Descripción")
    .fill("Algodón suave.\n\nHecha a pedido.");
  await page.getByLabel("Precio base (₡)").fill("12000");
  await page
    .getByLabel("Tiempo de producción (opcional)")
    .fill("Lista en 2 semanas");
  await page.getByRole("button", { name: "Agregar opción" }).click();
  await page.getByLabel("Nombre de la opción 1").fill("Talla");
  await page.getByLabel("Opción 1, valor 1", { exact: true }).fill("S");
  await page.getByRole("button", { name: "Agregar valor" }).click();
  await page.getByLabel("Opción 1, valor 2", { exact: true }).fill("XL");
  await page.getByLabel("Precio extra de opción 1, valor 2").fill("2000");
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page).toHaveURL("/admin/productos");
  const row = page.getByRole("row", { name: /Camiseta Básica E2E/ });
  await expect(row).toContainText("Visible");

  // Public catalog shows it right away (cache refreshed by the admin save).
  await page.goto("/productos");
  const card = page.getByRole("link", { name: /Camiseta Básica E2E/ });
  // The card also holds the name, so match the price part only.
  await expect(card).toContainText(/Desde\s₡12\s000/);
  await card.click();

  await expect(page).toHaveURL("/productos/camiseta-basica-e2e");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Camiseta Básica E2E",
  );
  await expect(page.getByText("Lista en 2 semanas")).toBeVisible();
  const shownPrice = page.getByTestId("price");
  await expect(shownPrice).toHaveText(price("Desde ₡12 000"));
  await page.getByRole("radio", { name: "XL" }).check();
  await expect(shownPrice).toHaveText(price("₡14 000"));
  await page.getByRole("radio", { name: "S", exact: true }).check();
  await expect(shownPrice).toHaveText(price("₡12 000"));
});
