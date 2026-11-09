import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Placeholder values so the server passes startup env validation.
// E2E smoke tests never reach Mongo or S3.
const E2E_ENV = {
  MONGODB_URI: "mongodb://127.0.0.1:27017",
  MONGODB_DB: "hanslistenia_e2e",
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "e2e-placeholder",
  AWS_SECRET_ACCESS_KEY: "e2e-placeholder",
  S3_RECEIPTS_BUCKET: "e2e-receipts",
  S3_PRODUCTS_BUCKET: "e2e-products",
  LOG_LEVEL: "warn",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: E2E_ENV,
  },
});
