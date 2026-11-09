import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { parseEnv } from "@/config/env";
import { verifyPassword } from "@/domain/auth/password";

const run = promisify(execFile);
const SCRIPT = "scripts/admin-credentials.mts";

function line(output: string, prefix: string): string {
  const found = output.split("\n").find((l) => l.startsWith(prefix));
  if (!found) throw new Error(`missing "${prefix}" in output`);
  return found.slice(prefix.length).trim();
}

describe("npm run admin:credentials", () => {
  it("prints env values that validate and a password the hash accepts", async () => {
    const { stdout } = await run("node", [SCRIPT, "Hans"]);
    const password = line(stdout, "Password:");
    const env = {
      ADMIN_USERNAME: line(stdout, "ADMIN_USERNAME="),
      ADMIN_PASSWORD_HASH: line(stdout, "ADMIN_PASSWORD_HASH="),
      SESSION_SECRET: line(stdout, "SESSION_SECRET="),
    };

    expect(env.ADMIN_USERNAME).toBe("hans");
    await expect(
      verifyPassword(password, env.ADMIN_PASSWORD_HASH),
    ).resolves.toBe(true);
    expect(() =>
      parseEnv({
        MONGODB_URI: "mongodb://localhost",
        MONGODB_DB: "x",
        AWS_REGION: "x",
        AWS_ACCESS_KEY_ID: "x",
        AWS_SECRET_ACCESS_KEY: "x",
        S3_RECEIPTS_BUCKET: "x",
        S3_PRODUCTS_BUCKET: "x",
        S3_PRODUCTS_PUBLIC_URL: "https://x.example.com",
        ...env,
      }),
    ).not.toThrow();
  });

  it("exits with usage help when no username is given", async () => {
    await expect(run("node", [SCRIPT])).rejects.toMatchObject({
      code: 64,
      stderr: expect.stringContaining("Usage"),
    });
  });
});
