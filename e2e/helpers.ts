import type { Page } from "@playwright/test";

/** Logs in as the E2E admin and waits for the admin panel. */
import { E2E_ADMIN } from "./admin-credentials";

export async function logIn(
  page: Page,
  username = E2E_ADMIN.username,
  password = E2E_ADMIN.password,
) {
  await page.goto("/admin/login");
  await page.getByLabel("Usuario").fill(username);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/admin");
}
