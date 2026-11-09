import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN } from "./e2e/admin-credentials";
import { e2eMongo } from "./test-support/mongo-container";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Env for the E2E server. Mongo is a throwaway Docker container started by
// the webServer command; S3 values are placeholders (no E2E test reaches S3).
const E2E_ENV = {
  MONGODB_URI: e2eMongo.uri,
  MONGODB_DB: "hanslistenia_e2e",
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "e2e-placeholder",
  AWS_SECRET_ACCESS_KEY: "e2e-placeholder",
  S3_RECEIPTS_BUCKET: "e2e-receipts",
  S3_PRODUCTS_BUCKET: "e2e-products",
  // TODO(photos E2E): point at an s3mock container — see e2e/catalog.spec.ts.
  S3_PRODUCTS_PUBLIC_URL: "http://127.0.0.1:9/e2e-products",
  ADMIN_USERNAME: E2E_ADMIN.username,
  ADMIN_PASSWORD_HASH: E2E_ADMIN.passwordHash,
  SESSION_SECRET: "e2e-session-secret-not-secret-0123456789",
  LOG_LEVEL: "warn",
};

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Mongo first: Playwright starts webServer before globalSetup, and the
    // build may read the database (static catalog pages).
    command: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON e2e/start-mongo.mts && npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    // Never reuse: teardown removes the database a reused server would use.
    reuseExistingServer: false,
    timeout: 180_000,
    env: E2E_ENV,
  },
});
