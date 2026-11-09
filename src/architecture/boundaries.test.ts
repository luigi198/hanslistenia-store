import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function restrictedImportErrors(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

describe("layer boundaries", () => {
  it.each([
    ['import { MongoClient } from "mongodb";'],
    ['import { S3Client } from "@aws-sdk/client-s3";'],
    ['import { redirect } from "next/navigation";'],
    ['import { getMongoClient } from "@/storage/mongo/client";'],
    ['import Page from "@/app/page";'],
    ['import { getEnv } from "@/config/env";'],
  ])("rejects in domain/: %s", async (code) => {
    const errors = await restrictedImportErrors(
      `${code}\nexport {};\n`,
      "src/domain/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });

  it("allows domain/ to import shared utilities", async () => {
    const errors = await restrictedImportErrors(
      'import { createLogger } from "@/shared/logger";\nexport { createLogger };\n',
      "src/domain/sample.ts",
    );
    expect(errors).toHaveLength(0);
  });

  it("allows storage/ to import domain ports", async () => {
    const errors = await restrictedImportErrors(
      'import type { X } from "@/domain/ports/x";\nexport type { X };\n',
      "src/storage/sample.ts",
    );
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['import { placeOrder } from "@/domain/orders/service";'],
    ['import Page from "@/app/page";'],
  ])("rejects in storage/: %s", async (code) => {
    const errors = await restrictedImportErrors(
      `${code}\nexport {};\n`,
      "src/storage/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });
});

describe("app/ and shared/ boundaries", () => {
  it.each([
    ['import { getMongoClient } from "@/storage/mongo/client";'],
    ['import { MongoClient } from "mongodb";'],
    ['import { S3Client } from "@aws-sdk/client-s3";'],
  ])("rejects in app/: %s", async (code) => {
    const errors = await restrictedImportErrors(
      `${code}\nexport {};\n`,
      "src/app/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });

  it("allows app/ to import the composition root and domain", async () => {
    const errors = await restrictedImportErrors(
      'import { services } from "@/composition/services";\nimport type { X } from "@/domain/ports/x";\nexport { services };\nexport type { X };\n',
      "src/app/sample.ts",
    );
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['import { getEnv } from "@/config/env";'],
    ['import { x } from "@/domain/x";'],
    ['import { x } from "@/storage/x";'],
    ['import { MongoClient } from "mongodb";'],
  ])("rejects in shared/: %s", async (code) => {
    const errors = await restrictedImportErrors(
      `${code}\nexport {};\n`,
      "src/shared/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });
});
