import { createHash, timingSafeEqual } from "node:crypto";
import type { LoginAttemptStore } from "@/domain/ports/login-attempt-store";
import type { Logger } from "@/shared/logger";
import {
  ATTEMPT_WINDOW_MS,
  ipAttemptKey,
  MAX_FAILED_ATTEMPTS_PER_IP,
  normalizeUsername,
  SESSION_TTL_MS,
} from "./login-policy";
import { verifyPassword } from "./password";
import {
  createSessionToken,
  verifySessionToken,
  type IssuedSession,
  type SessionClaims,
} from "./session-token";

export interface AdminCredentials {
  username: string;
  /** Encoded argon2id hash, see ./password. */
  passwordHash: string;
}

export interface AdminAuthDeps {
  credentials: AdminCredentials;
  sessionSecret: string;
  attempts: LoginAttemptStore;
  logger: Logger;
  now?: () => Date;
}

export interface LoginAttempt {
  username: string;
  password: string;
  clientIp: string;
}

/**
 * Expected outcomes are values; infrastructure failures (attempt store down)
 * throw, and login fails closed.
 */
export type LoginResult =
  | { ok: true; session: IssuedSession }
  | { ok: false; reason: "invalid_credentials" | "locked_out" };

function sameUsername(a: string, b: string): boolean {
  // Hash first so timingSafeEqual gets equal lengths and leaks nothing.
  const digest = (s: string) =>
    createHash("sha256").update(normalizeUsername(s)).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export class AdminAuthService {
  private readonly now: () => Date;
  private readonly subject: string;

  constructor(private readonly deps: AdminAuthDeps) {
    this.now = deps.now ?? (() => new Date());
    this.subject = normalizeUsername(deps.credentials.username);
  }

  async login(input: LoginAttempt): Promise<LoginResult> {
    const { attempts, logger, credentials } = this.deps;
    const now = this.now();
    const ipKey = ipAttemptKey(input.clientIp);

    // Count before checking: an atomic increment means parallel requests
    // can't all observe the old count and slip past the limit.
    const attemptNumber = await attempts.registerAttempt(
      ipKey,
      now,
      ATTEMPT_WINDOW_MS,
    );
    if (attemptNumber > MAX_FAILED_ATTEMPTS_PER_IP) {
      logger.warn("admin_login_locked_out", { attemptNumber });
      return { ok: false, reason: "locked_out" };
    }

    // Always verify the password, even for a wrong username, so response
    // time doesn't reveal which of the two was wrong.
    const usernameOk = sameUsername(input.username, credentials.username);
    const passwordOk = await verifyPassword(
      input.password,
      credentials.passwordHash,
    );

    if (!usernameOk || !passwordOk) {
      logger.warn("admin_login_failed", { attemptNumber });
      return { ok: false, reason: "invalid_credentials" };
    }

    await attempts.clearAttempts(ipKey);
    const session = createSessionToken({
      subject: this.subject,
      now,
      ttlMs: SESSION_TTL_MS,
      secret: this.deps.sessionSecret,
    });
    logger.info("admin_login_succeeded", {
      expiresAt: session.expiresAt.toISOString(),
    });
    return { ok: true, session };
  }

  /**
   * The admin session for a cookie value, or null if absent, invalid,
   * expired, or issued for a previous admin username.
   */
  verifySession(token: string | undefined): SessionClaims | null {
    if (!token) return null;
    const claims = verifySessionToken(
      token,
      this.now(),
      this.deps.sessionSecret,
    );
    return claims?.subject === this.subject ? claims : null;
  }
}
