import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed session token: `<payload>.<signature>`, both base64url.
 * The payload is `{ sub, exp }` (exp in epoch ms); the signature is
 * HMAC-SHA256 over the encoded payload. Signed, not encrypted — it holds
 * nothing secret.
 */

/** Shorter signing keys are rejected at startup (see config/env). */
export const MIN_SESSION_SECRET_LENGTH = 32;
const GENERATED_SECRET_BYTES = 32; // 256 bits → 43 base64url characters

export function generateSessionSecret(): string {
  return randomBytes(GENERATED_SECRET_BYTES).toString("base64url");
}

export interface SessionClaims {
  subject: string;
  expiresAt: Date;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

function sign(encodedPayload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

export function createSessionToken(input: {
  subject: string;
  now: Date;
  ttlMs: number;
  secret: string;
}): IssuedSession {
  const expiresAt = new Date(input.now.getTime() + input.ttlMs);
  const payload = Buffer.from(
    JSON.stringify({ sub: input.subject, exp: expiresAt.getTime() }),
  ).toString("base64url");
  const signature = sign(payload, input.secret).toString("base64url");
  return { token: `${payload}.${signature}`, expiresAt };
}

function parseClaims(encodedPayload: string): SessionClaims | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (typeof parsed !== "object" || parsed === null) return null;
    if (!("sub" in parsed) || !("exp" in parsed)) return null;
    const { sub, exp } = parsed;
    if (typeof sub !== "string" || typeof exp !== "number") return null;
    return { subject: sub, expiresAt: new Date(exp) };
  } catch {
    return null; // Not JSON: a forged or corrupted token.
  }
}

/** Claims of a valid, unexpired token signed with `secret`; otherwise null. */
export function verifySessionToken(
  token: string,
  now: Date,
  secret: string,
): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  const claims = parseClaims(payload);
  if (!claims || claims.expiresAt <= now) return null;
  return claims;
}
