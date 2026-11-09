import { sanitizeFields } from "./log-sanitizer";

export { REDACTED } from "./log-sanitizer";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  child(bound: LogFields): Logger;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LoggerOptions {
  level: LogLevel;
  write?: (line: string) => void;
  bound?: LogFields;
}

const writeToStdout = (line: string) => process.stdout.write(`${line}\n`);

export function createLogger({
  level,
  write = writeToStdout,
  bound = {},
}: LoggerOptions): Logger {
  const minRank = LEVEL_RANK[level];

  const emit = (entryLevel: LogLevel, msg: string, fields: LogFields = {}) => {
    if (LEVEL_RANK[entryLevel] < minRank) return;
    const safe = sanitizeFields({ ...bound, ...fields });
    write(
      JSON.stringify({
        ...safe,
        level: entryLevel,
        msg,
        time: new Date().toISOString(),
      }),
    );
  };

  return {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (extra) =>
      createLogger({ level, write, bound: { ...bound, ...extra } }),
  };
}
