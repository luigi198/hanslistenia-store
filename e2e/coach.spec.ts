import { expect, test } from "@playwright/test";

/** Portrait + one per bio section (5) + the closing photo. */
const EXPECTED_PHOTOS = 7;

test("the coach's bio is reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "El coach" })
    .click();

  await expect(page).toHaveURL("/sobre-el-coach");
  await expect(page).toHaveTitle(/Hans Barrantes/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hans Barrantes",
  );
  await expect(
    page.getByText(
      "Hanslistenia | Promotor, atleta, instructor y fundador de Conatus Centro de Movimiento Integral",
    ),
  ).toBeVisible();
  for (const section of [
    "Mi historia: encontrar un propósito en el movimiento",
    "Del aprendizaje personal a enseñar a otros",
    "CONATUS: una idea que se convirtió en comunidad",
    "Mi misión",
    "Lo que representa la calistenia para mí",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: section }),
    ).toBeVisible();
  }
  await expect(
    page.getByText("quiero ayudar a otras personas a descubrir de qué son"),
  ).toBeVisible();
});

test("the bio shows the coach's photos, all loaded", async ({ page }) => {
  await page.goto("/sobre-el-coach");
  const photos = page.getByRole("main").getByRole("img");
  await expect(photos).toHaveCount(EXPECTED_PHOTOS);

  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveAttribute("alt", /Hans/);
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("an unknown page under the bio's path is a 404", async ({ page }) => {
  const response = await page.goto("/sobre-el-coach/otra-cosa");
  expect(response?.status()).toBe(404);
});
