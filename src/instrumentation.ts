// Runs once per server instance before it accepts requests: fail fast on bad config.
const EXIT_CODE_CONFIG_ERROR = 78; // EX_CONFIG from sysexits.h

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ConfigError, getEnv } = await import("./config/env");
  const { getLogger } = await import("./config/logger");
  const { createLogger } = await import("./shared/logger");

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
