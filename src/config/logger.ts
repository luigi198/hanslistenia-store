import { createLogger, type Logger } from "@/shared/logger";
import { getEnv } from "./env";

let cached: Logger | undefined;

/** App-wide logger configured from env. Server-only. */
export function getLogger(): Logger {
  cached ??= createLogger({ level: getEnv().LOG_LEVEL });
  return cached;
}
