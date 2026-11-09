import { z } from "zod";
import { isPasswordHash } from "@/domain/auth/password";
import { MIN_SESSION_SECRET_LENGTH } from "@/domain/auth/session-token";
import { LOG_LEVELS } from "@/shared/logger";
const MONGODB_URI_PATTERN = /^mongodb(\+srv)?:\/\//;

const nonEmpty = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });

const envSchema = z.object({
  MONGODB_URI: nonEmpty.regex(MONGODB_URI_PATTERN),
  MONGODB_DB: nonEmpty,
  AWS_REGION: nonEmpty,
  AWS_ACCESS_KEY_ID: nonEmpty,
  AWS_SECRET_ACCESS_KEY: nonEmpty,
  S3_RECEIPTS_BUCKET: nonEmpty,
  S3_PRODUCTS_BUCKET: nonEmpty,
  // Base URL product photos are served from (bucket URL or a CDN in front).
  S3_PRODUCTS_PUBLIC_URL: httpUrl.transform((url) => url.replace(/\/+$/, "")),
  // Only for S3-compatible local mocks; unset in production (real AWS).
  S3_ENDPOINT: httpUrl.optional(),
  ADMIN_USERNAME: nonEmpty,
  ADMIN_PASSWORD_HASH: nonEmpty.refine(isPasswordHash),
  SESSION_SECRET: nonEmpty.min(MIN_SESSION_SECRET_LENGTH),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

export type Env = z.infer<typeof envSchema>;

const SCHEMA_KEYS = Object.keys(envSchema.shape);

/** Unrecoverable: the server cannot run without valid configuration. */
export class ConfigError extends Error {
  readonly invalidKeys: readonly string[];

  constructor(invalidKeys: readonly string[]) {
    // Only variable names — values may be secrets.
    super(
      `Invalid or missing environment variables: ${invalidKeys.join(", ")}`,
    );
    this.name = "ConfigError";
    this.invalidKeys = invalidKeys;
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const bad = new Set(
    result.error.issues.map((issue) => String(issue.path[0])),
  );
  throw new ConfigError(SCHEMA_KEYS.filter((key) => bad.has(key)));
}

let cached: Env | undefined;

/** Validated process env, parsed once per server instance. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
