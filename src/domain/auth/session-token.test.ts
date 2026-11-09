import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  generateSessionSecret,
  MIN_SESSION_SECRET_LENGTH,
  verifySessionToken,
} from "./session-token";

const SECRET = "s".repeat(48);
const OTHER_SECRET = "o".repeat(48);
const HOUR_MS = 60 * 60 * 1000;
const NOW = new Date("2026-11-08T12:00:00Z");

function issue(now = NOW) {
  return createSessionToken({
    subject: "admin",
    now,
    ttlMs: HOUR_MS,
    secret: SECRET,
  });
}

describe("session tokens", () => {
  it("verifies a token it issued and returns subject and expiry", () => {
    const { token, expiresAt } = issue();
    expect(expiresAt).toEqual(new Date(NOW.getTime() + HOUR_MS));
    expect(verifySessionToken(token, NOW, SECRET)).toEqual({
      subject: "admin",
      expiresAt,
    });
  });

  it("rejects an expired token", () => {
    const { token } = issue();
    const later = new Date(NOW.getTime() + HOUR_MS);
    expect(verifySessionToken(token, later, SECRET)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const { token } = issue();
    expect(verifySessionToken(token, NOW, OTHER_SECRET)).toBeNull();
  });

  it("rejects a token whose payload was tampered with", () => {
    const { token } = issue();
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "admin", exp: NOW.getTime() + 100 * HOUR_MS }),
    ).toString("base64url");
    expect(
      verifySessionToken(`${forgedPayload}.${signature}`, NOW, SECRET),
    ).toBeNull();
  });

  it.each([[""], ["garbage"], ["a.b"], ["a.b.c"], [".."]])(
    "rejects malformed input: %j",
    (bad) => {
      expect(verifySessionToken(bad, NOW, SECRET)).toBeNull();
    },
  );
});

describe("generateSessionSecret", () => {
  it("returns distinct secrets long enough for signing", () => {
    const a = generateSessionSecret();
    expect(a.length).toBeGreaterThanOrEqual(MIN_SESSION_SECRET_LENGTH);
    expect(a).not.toBe(generateSessionSecret());
  });
});
