import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./admin-credentials";
import { logIn } from "./helpers";

const SESSION_HOURS = 8;
const HOUR_SECONDS = 3600;

// Own client IP so rate-limit state never leaks between tests.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.10" } });

test("admin logs in, reaches the panel and logs out", async ({
  page,
  context,
}) => {
  // Not indexable: header and meta tag.
  const loginResponse = await page.goto("/admin/login");
  expect(loginResponse?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );

  // Phone keyboards capitalize the first letter; login still works.
  await logIn(page, "Admin-E2E", E2E_ADMIN.password);
  await expect(page).toHaveURL("/admin");
  await expect(
    page.getByRole("heading", { name: "Panel de administración" }),
  ).toBeVisible();

  const [cookie] = await context.cookies();
  expect(cookie).toMatchObject({
    name: "__Host-hl_admin",
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
  });
  const hoursLeft = (cookie.expires - Date.now() / 1000) / HOUR_SECONDS;
  expect(hoursLeft).toBeGreaterThan(SESSION_HOURS - 0.1);
  expect(hoursLeft).toBeLessThanOrEqual(SESSION_HOURS);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/admin/login");
  expect(await context.cookies()).toHaveLength(0);

  // Without a session the panel sends the user back to login.
  await page.goto("/admin");
  await expect(page).toHaveURL("/admin/login");
});
