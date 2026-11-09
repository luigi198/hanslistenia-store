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
  S3_PRODUCTS_PUBLIC_URL: "https://hl-products.s3.us-east-1.amazonaws.com",
  ADMIN_USERNAME: "hans",
  ADMIN_PASSWORD_HASH:
    "argon2id:v=19:m=19456,t=2,p=1:c2FsdHNhbHRzYWx0c2FsdA:aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g",
  SESSION_SECRET: "x".repeat(32),
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

  it("rejects an ADMIN_PASSWORD_HASH that is not an encoded argon2id hash", () => {
    expect(() =>
      parseEnv({ ...VALID, ADMIN_PASSWORD_HASH: "plain-password" }),
    ).toThrow(/ADMIN_PASSWORD_HASH/);
  });

  it("rejects a SESSION_SECRET shorter than 32 characters", () => {
    expect(() => parseEnv({ ...VALID, SESSION_SECRET: "short" })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it("rejects an S3_PRODUCTS_PUBLIC_URL that is not an http(s) URL", () => {
    expect(() =>
      parseEnv({ ...VALID, S3_PRODUCTS_PUBLIC_URL: "hl-products" }),
    ).toThrow(/S3_PRODUCTS_PUBLIC_URL/);
  });

  it("strips a trailing slash from S3_PRODUCTS_PUBLIC_URL", () => {
    const env = parseEnv({
      ...VALID,
      S3_PRODUCTS_PUBLIC_URL: "https://cdn.example.com/",
    });
    expect(env.S3_PRODUCTS_PUBLIC_URL).toBe("https://cdn.example.com");
  });

  it("treats S3_ENDPOINT as optional but validates it when set", () => {
    expect(parseEnv(VALID).S3_ENDPOINT).toBeUndefined();
    expect(() => parseEnv({ ...VALID, S3_ENDPOINT: "nope" })).toThrow(
      /S3_ENDPOINT/,
    );
    expect(
      parseEnv({ ...VALID, S3_ENDPOINT: "http://127.0.0.1:9191" }).S3_ENDPOINT,
    ).toBe("http://127.0.0.1:9191");
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
