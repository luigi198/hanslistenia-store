export const REDACTED = "[REDACTED]";
const CIRCULAR = "[Circular]";

// Keys whose values are PII, credentials or tokens (Ley 8968 + global logging rules).
// Keys are compared lowercased and without diacritics ("cédula" → "cedula").
// Fragments match anywhere in the key ("shippingAddress", "trackingToken").
const SENSITIVE_KEY_FRAGMENTS = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "accesskey",
  "credential",
  "connectionstring",
  "cedula",
  "phone",
  "telefono",
  "email",
  "correo",
  "address",
  "direccion",
  "senas",
  "fullname",
  "firstname",
  "lastname",
  "buyername",
  "nombre",
  "apellido",
] as const;
// Short words that would over-match as fragments ("uri" ⊂ "security").
const SENSITIVE_EXACT_KEYS = new Set(["name", "uri", "url"]);

// Free-text scrubbing for error messages/stacks, which may embed PII
// (e.g. Mongo duplicate-key errors echo the duplicate value).
const EMAIL_PATTERN = /[^\s@"'<>{}]+@[^\s@"'<>{}]+\.[^\s@"'<>{}]+/g;
// 7+ chars of digits/dashes: cédulas (1-2345-6789), phones (8888-8888).
const ID_NUMBER_PATTERN = /\d[\d-]{6,}\d/g;

function normalizeKey(key: string): string {
  return key.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  if (SENSITIVE_EXACT_KEYS.has(normalized)) return true;
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

export function scrubText(text: string): string {
  return text
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(ID_NUMBER_PATTERN, REDACTED);
}

function hasToJSON(value: object): value is { toJSON: () => unknown } {
  return typeof (value as { toJSON?: unknown }).toJSON === "function";
}

/**
 * Returns a JSON-safe copy of `value` with sensitive keys redacted.
 * O(n) time in the number of nodes; O(depth) extra space for the ancestor set,
 * so shared references are kept and only true cycles become "[Circular]".
 */
export function sanitize(
  value: unknown,
  ancestors = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function" || typeof value === "symbol")
    return undefined;
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) return CIRCULAR;

  ancestors.add(value);
  try {
    return sanitizeObject(value, ancestors);
  } finally {
    ancestors.delete(value);
  }
}

function sanitizeObject(value: object, ancestors: WeakSet<object>): unknown {
  if (value instanceof Error) return sanitizeError(value, ancestors);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Map) return sanitizeEntries(value.entries(), ancestors);
  if (value instanceof Set)
    return [...value].map((item) => sanitize(item, ancestors));
  if (Array.isArray(value))
    return value.map((item) => sanitize(item, ancestors));
  if (hasToJSON(value)) return sanitize(value.toJSON(), ancestors);
  return sanitizeEntries(Object.entries(value), ancestors);
}

/** Sanitizes a top-level fields object (see `sanitize`). */
export function sanitizeFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeEntries(Object.entries(fields), new WeakSet());
}

function sanitizeEntries(
  entries: Iterable<[unknown, unknown]>,
  ancestors: WeakSet<object>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, child] of entries) {
    const key = String(rawKey);
    out[key] = isSensitiveKey(key) ? REDACTED : sanitize(child, ancestors);
  }
  return out;
}

function sanitizeError(
  error: Error,
  ancestors: WeakSet<object>,
): Record<string, unknown> {
  // Own enumerable props carry driver details (code, errorResponse, ...).
  const extra = sanitizeEntries(Object.entries(error), ancestors);
  return {
    ...extra,
    name: error.name,
    message: scrubText(error.message),
    stack: error.stack === undefined ? undefined : scrubText(error.stack),
    cause:
      error.cause === undefined ? undefined : sanitize(error.cause, ancestors),
  };
}
