import { describe, expect, it } from "vitest";
import {
  generatePassword,
  hashPassword,
  isPasswordHash,
  verifyPassword,
} from "./password";

describe("password hashing (argon2id)", () => {
  it("verifies the password it hashed", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(isPasswordHash(hash)).toBe(true);
    expect(hash.startsWith("argon2id:")).toBe(true);
    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(
      verifyPassword("Correct horse battery staple", hash),
    ).resolves.toBe(false);
  });

  it("salts each hash so equal passwords hash differently", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same"),
      hashPassword("same"),
    ]);
    expect(a).not.toBe(b);
  });

  it("never contains '$', so the value survives .env variable expansion", async () => {
    expect(await hashPassword("pw")).not.toContain("$");
  });

  it.each([
    [""],
    ["not-a-hash"],
    ["$argon2id$v=19$m=19456,t=2,p=1$abc$def"],
    ["argon2id:v=19:m=19456,t=2,p=1:onlysalt"],
    // Out of the ranges Node's argon2 accepts (it would throw on every login):
    ["argon2id:v=19:m=1,t=1,p=1:AAAAAAAAAAA:AAAAAAAAAAA"], // memory < 8*p
    ["argon2id:v=19:m=19456,t=0,p=1:AAAAAAAAAAA:AAAAAAAAAAA"], // no passes
    ["argon2id:v=19:m=19456,t=2,p=1:AA:AAAAAAAAAAA"], // salt < 8 bytes
    ["argon2id:v=19:m=19456,t=2,p=1:AAAAAAAAAAA:AA"], // tag < 4 bytes
    ["argon2id:v=19:m=99999999999,t=2,p=1:AAAAAAAAAAA:AAAAAAAAAAA"], // absurd memory
    ["argon2id:v=19:m=19456,t=99999999999,p=1:AAAAAAAAAAA:AAAAAAAAAAA"], // absurd passes
    ["argon2id:v=19:m=1048576,t=2,p=99999:AAAAAAAAAAA:AAAAAAAAAAA"], // absurd lanes
  ])("treats a malformed hash as non-matching: %j", async (bad) => {
    expect(isPasswordHash(bad)).toBe(false);
    await expect(verifyPassword("pw", bad)).resolves.toBe(false);
  });
});

describe("generatePassword", () => {
  it("returns a long random password", () => {
    const a = generatePassword();
    const b = generatePassword();
    expect(a.length).toBeGreaterThanOrEqual(24);
    expect(a).not.toBe(b);
  });
});
