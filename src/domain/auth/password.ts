import { argon2, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * argon2id password hashing on Node's built-in implementation.
 *
 * Encoded as `argon2id:v=19:m=<KiB>,t=<passes>,p=<lanes>:<salt>:<hash>`
 * (base64url). It mirrors the PHC string but uses ':' instead of '$', because
 * Next.js expands `$NAME` inside .env files and would corrupt a PHC string.
 */

// OWASP Password Storage Cheat Sheet, argon2id minimum: m=19 MiB, t=2, p=1.
const MEMORY_KIB = 19_456;
const PASSES = 2;
const PARALLELISM = 1;
const SALT_BYTES = 16;
const TAG_BYTES = 32;
const ARGON2_VERSION = 19;
const GENERATED_PASSWORD_BYTES = 24; // 192 bits → 32 base64url characters

const ENCODED_PATTERN =
  /^argon2id:v=19:m=(\d+),t=(\d+),p=(\d+):([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)$/;

// Ranges Node's argon2 accepts (RFC 9106), with a sane memory ceiling so a
// bad hash fails env validation at startup instead of every login throwing.
const MIN_PASSES = 1;
const MIN_PARALLELISM = 1;
const MIN_MEMORY_KIB_PER_LANE = 8;
const MAX_MEMORY_KIB = 1_048_576; // 1 GiB
// Far above any sane setting, far below where a login would hang or Node
// would throw (its limits are 2^32-1 passes and 2^24-1 lanes).
const MAX_PASSES = 16;
const MAX_PARALLELISM = 16;
const MIN_SALT_BYTES = 8;
const MIN_TAG_BYTES = 4;

interface DecodedHash {
  memory: number;
  passes: number;
  parallelism: number;
  salt: Buffer;
  hash: Buffer;
}

function derive(
  password: string,
  params: Omit<DecodedHash, "hash">,
  tagLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2(
      "argon2id",
      {
        message: password,
        nonce: params.salt,
        memory: params.memory,
        passes: params.passes,
        parallelism: params.parallelism,
        tagLength,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

function decode(encoded: string): DecodedHash | null {
  const match = ENCODED_PATTERN.exec(encoded);
  if (!match) return null;
  const [, memory, passes, parallelism, salt, hash] = match;
  const decoded = {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
    salt: Buffer.from(salt, "base64url"),
    hash: Buffer.from(hash, "base64url"),
  };
  const inRange =
    decoded.passes >= MIN_PASSES &&
    decoded.passes <= MAX_PASSES &&
    decoded.parallelism >= MIN_PARALLELISM &&
    decoded.parallelism <= MAX_PARALLELISM &&
    decoded.memory >= MIN_MEMORY_KIB_PER_LANE * decoded.parallelism &&
    decoded.memory <= MAX_MEMORY_KIB &&
    decoded.salt.length >= MIN_SALT_BYTES &&
    decoded.hash.length >= MIN_TAG_BYTES;
  return inRange ? decoded : null;
}

export function isPasswordHash(value: string): boolean {
  return decode(value) !== null;
}

export async function hashPassword(password: string): Promise<string> {
  const params = {
    memory: MEMORY_KIB,
    passes: PASSES,
    parallelism: PARALLELISM,
    salt: randomBytes(SALT_BYTES),
  };
  const hash = await derive(password, params, TAG_BYTES);
  return [
    "argon2id",
    `v=${ARGON2_VERSION}`,
    `m=${params.memory},t=${params.passes},p=${params.parallelism}`,
    params.salt.toString("base64url"),
    hash.toString("base64url"),
  ].join(":");
}

/** False for a wrong password or a malformed hash; never throws on input. */
export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const decoded = decode(encoded);
  if (!decoded) return false;
  const candidate = await derive(password, decoded, decoded.hash.length);
  return timingSafeEqual(candidate, decoded.hash);
}

export function generatePassword(): string {
  return randomBytes(GENERATED_PASSWORD_BYTES).toString("base64url");
}
