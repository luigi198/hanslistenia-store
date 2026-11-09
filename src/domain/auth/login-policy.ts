import { createHash } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * Failed attempts allowed from one client network per window; the next one
 * is refused without checking the password. There is deliberately no
 * per-username limit: anyone could use it to lock the coach out, and the
 * generated 192-bit password already makes distributed guessing hopeless.
 */
export const MAX_FAILED_ATTEMPTS_PER_IP = 5;
export const ATTEMPT_WINDOW_MS = 15 * MINUTE_MS;
export const SESSION_TTL_MS = 8 * HOUR_MS;

const IPV6_GROUPS = 8;
const IPV6_PREFIX_GROUPS = 4; // /64: one subscriber/host typically owns it all
const IPV4_MAPPED_PREFIX = "::ffff:";

/** Upper bound of the wait after a lockout, for user-facing copy. */
export function lockoutMinutes(): number {
  return Math.ceil(ATTEMPT_WINDOW_MS / MINUTE_MS);
}

/** Usernames compare case-insensitively: phone keyboards auto-capitalize. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function expandIPv6(ip: string): string[] {
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail !== undefined && tail ? tail.split(":") : [];
  const zeros =
    tail === undefined
      ? []
      : Array(IPV6_GROUPS - left.length - right.length).fill("0");
  return [...left, ...zeros, ...right].map((g) => g.replace(/^0+(?=.)/, ""));
}

/**
 * The unit rate limiting applies to: the IPv4 address itself, or the /64
 * prefix of an IPv6 address (otherwise one host could rotate through 2^64
 * addresses). Non-IP values such as "unknown" pass through unchanged.
 */
export function clientNetwork(ip: string): string {
  const lower = ip.toLowerCase();
  if (lower.startsWith(IPV4_MAPPED_PREFIX)) {
    const v4 = lower.slice(IPV4_MAPPED_PREFIX.length);
    if (isIPv4(v4)) return v4;
  }
  if (!isIPv6(ip)) return ip;
  return `${expandIPv6(ip).slice(0, IPV6_PREFIX_GROUPS).join(":")}::/64`;
}

/** Hashed so the attempt store never holds client IPs (personal data). */
export function ipAttemptKey(ip: string): string {
  const digest = createHash("sha256").update(clientNetwork(ip));
  return `ip:${digest.digest("base64url")}`;
}
