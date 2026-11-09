// Node.js-only startup: fail fast on bad config. Kept out of
// instrumentation.ts so the Edge bundle never sees process.exit.
import { ConfigError, getEnv } from "./config/env";
import { getLogger } from "./config/logger";
import { createLogger } from "./shared/logger";

const EXIT_CODE_CONFIG_ERROR = 78; // EX_CONFIG from sysexits.h

export function registerNode(): void {
  try {
    getEnv();
  } catch (error) {
    // Env-driven logger is unavailable here, so use a fixed-level one.
    const fields =
      error instanceof ConfigError
        ? { invalidKeys: error.invalidKeys }
        : { error };
    createLogger({ level: "error" }).error("config_invalid", fields);
    process.exit(EXIT_CODE_CONFIG_ERROR);
  }
  getLogger().info("server_started");
}
