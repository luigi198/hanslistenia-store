import { expect, test } from "@playwright/test";

test("home page renders in Spanish with the store name", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-CR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hanslistenia",
  );
  await expect(page).toHaveTitle(/Hanslistenia/);
});
