import { headers } from "next/headers";
import { getLogger } from "@/config/logger";

/** Used when no proxy header is present (e.g. local `next start`). */
const UNKNOWN_IP = "unknown";

/**
 * Client IP for rate limiting. On Vercel, `x-forwarded-for` is set by the
 * edge network (client-supplied values are overwritten), so its first entry
 * is the real client address. Without it every client shares one rate-limit
 * bucket, so that case is logged.
 */
export async function getClientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  if (ip) return ip;
  getLogger().warn("client_ip_missing", { header: "x-forwarded-for" });
  return UNKNOWN_IP;
}
