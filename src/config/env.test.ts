import { describe, expect, it } from "vitest";
import { ConfigError, parseEnv } from "./env";

const VALID = {
  MONGODB_URI: "mongodb+srv://user:s3cret@cluster0.example.mongodb.net",
  MONGODB_DB: "hanslistenia",
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "AKIAEXAMPLE",
  AWS_SECRET_ACCESS_KEY: "super-secret-value",
  S3_RECEIPTS_BUCKET: "hl-receipts",
  S3_PRODUCTS_BUCKET: "hl-products",
};

describe("parseEnv", () => {
  it("returns typed config for valid input and defaults LOG_LEVEL to info", () => {
    const env = parseEnv(VALID);
    expect(env.MONGODB_DB).toBe("hanslistenia");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("throws ConfigError naming every missing variable", () => {
    const partial: Record<string, string> = { ...VALID };
    delete partial.MONGODB_URI;
    delete partial.S3_RECEIPTS_BUCKET;
    expect(() => parseEnv(partial)).toThrow(ConfigError);
    try {
      parseEnv(partial);
    } catch (error) {
      expect((error as ConfigError).invalidKeys).toEqual([
        "MONGODB_URI",
        "S3_RECEIPTS_BUCKET",
      ]);
    }
  });

  it("rejects a MONGODB_URI that is not a mongodb URL", () => {
    expect(() => parseEnv({ ...VALID, MONGODB_URI: "postgres://x" })).toThrow(
      /MONGODB_URI/,
    );
  });

  it("rejects an unknown LOG_LEVEL", () => {
    expect(() => parseEnv({ ...VALID, LOG_LEVEL: "verbose" })).toThrow(
      /LOG_LEVEL/,
    );
  });

  it("never includes secret values in the error message", () => {
    const bad = {
      ...VALID,
      MONGODB_URI: "not-a-url-but-s3cret",
      AWS_REGION: "",
    };
    try {
      parseEnv(bad);
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain("s3cret");
      expect(message).not.toContain("super-secret-value");
    }
  });
});
