import { beforeAll, describe, expect, it } from "vitest";
import type { LoginAttemptStore } from "@/domain/ports/login-attempt-store";
import { createLogger } from "@/shared/logger";
import { AdminAuthService } from "./admin-auth-service";
import {
  ATTEMPT_WINDOW_MS,
  MAX_FAILED_ATTEMPTS_PER_IP,
  SESSION_TTL_MS,
} from "./login-policy";
import { hashPassword } from "./password";
import { createSessionToken } from "./session-token";

const USERNAME = "hans";
const PASSWORD = "a-very-long-generated-password";
const SECRET = "k".repeat(48);
const START = new Date("2026-11-08T12:00:00Z");

/**
 * Fixed-window attempt counter with real expiry, like the Mongo store.
 * registerAttempt has no await between read and write, so it is atomic.
 */
class InMemoryAttemptStore implements LoginAttemptStore {
  private readonly windows = new Map<
    string,
    { count: number; expiresAt: Date }
  >();

  async registerAttempt(key: string, now: Date, windowMs: number) {
    const w = this.windows.get(key);
    if (w && w.expiresAt > now) return ++w.count;
    this.windows.set(key, {
      count: 1,
      expiresAt: new Date(now.getTime() + windowMs),
    });
    return 1;
  }

  async clearAttempts(key: string) {
    this.windows.delete(key);
  }

  keys() {
    return [...this.windows.keys()];
  }
}

let passwordHash: string;
beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
});

function setup(
  store: LoginAttemptStore = new InMemoryAttemptStore(),
  username = USERNAME,
) {
  let now = START;
  const lines: string[] = [];
  const service = new AdminAuthService({
    credentials: { username, passwordHash },
    sessionSecret: SECRET,
    attempts: store,
    logger: createLogger({ level: "debug", write: (l) => lines.push(l) }),
    now: () => now,
  });
  const advance = (ms: number) => {
    now = new Date(now.getTime() + ms);
  };
  return { service, advance, lines };
}

const attempt = (
  password: string,
  clientIp = "203.0.113.7",
  username = USERNAME,
) => ({ username, password, clientIp });

async function failTimes(service: AdminAuthService, n: number, ip?: string) {
  for (let i = 0; i < n; i++) await service.login(attempt("nope", ip));
}

describe("AdminAuthService.login", () => {
  it("issues a verifiable session for the correct credentials", async () => {
    const { service } = setup();
    const result = await service.login(attempt(PASSWORD));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.expiresAt).toEqual(
      new Date(START.getTime() + SESSION_TTL_MS),
    );
    expect(service.verifySession(result.session.token)).toMatchObject({
      subject: USERNAME,
    });
  });

  it("accepts the username regardless of case and surrounding spaces", async () => {
    const { service } = setup();
    const result = await service.login(attempt(PASSWORD, undefined, "  Hans "));
    expect(result.ok).toBe(true);
  });

  it.each([
    ["wrong password", attempt("nope")],
    ["wrong username", attempt(PASSWORD, undefined, "someone")],
  ])("refuses a %s with the same generic reason", async (_label, input) => {
    const { service } = setup();
    await expect(service.login(input)).resolves.toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("locks an IP out after too many failures, even with the right password", async () => {
    const { service } = setup();
    await failTimes(service, MAX_FAILED_ATTEMPTS_PER_IP);
    await expect(service.login(attempt(PASSWORD))).resolves.toEqual({
      ok: false,
      reason: "locked_out",
    });
  });

  it("checks at most the allowed number of passwords for parallel attempts", async () => {
    const { service } = setup();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => service.login(attempt("nope"))),
    );
    const checked = results.filter(
      (r) => !r.ok && r.reason === "invalid_credentials",
    );
    expect(checked).toHaveLength(MAX_FAILED_ATTEMPTS_PER_IP);
  });

  it("treats every address in one IPv6 /64 as the same client", async () => {
    const { service } = setup();
    for (let i = 1; i <= MAX_FAILED_ATTEMPTS_PER_IP; i++) {
      await service.login(attempt("nope", `2001:db8:1:2::${i}`));
    }
    const result = await service.login(
      attempt(PASSWORD, "2001:db8:1:2:ffff::9"),
    );
    expect(result).toEqual({ ok: false, reason: "locked_out" });
  });

  it("does not lock the admin out because of failures from other IPs", async () => {
    const { service } = setup();
    for (let i = 0; i < 50; i++) {
      await service.login(attempt("nope", `198.51.100.${i}`));
    }
    expect((await service.login(attempt(PASSWORD, "192.0.2.99"))).ok).toBe(
      true,
    );
  });

  it("lets the user in again once the window has passed", async () => {
    const { service, advance } = setup();
    await failTimes(service, MAX_FAILED_ATTEMPTS_PER_IP);
    advance(ATTEMPT_WINDOW_MS);
    expect((await service.login(attempt(PASSWORD))).ok).toBe(true);
  });

  it("resets the count after a successful login", async () => {
    const { service } = setup();
    for (let round = 0; round < 2; round++) {
      await failTimes(service, MAX_FAILED_ATTEMPTS_PER_IP - 1);
      expect((await service.login(attempt(PASSWORD))).ok).toBe(true);
    }
  });

  it("never stores or logs the raw IP, username or password", async () => {
    const store = new InMemoryAttemptStore();
    const { service, lines } = setup(store);
    await service.login(attempt("wrong-secret-pw", "203.0.113.7", "intruder"));
    await service.login(attempt(PASSWORD));
    const persisted = [...store.keys(), ...lines].join("\n");
    for (const raw of [
      "203.0.113.7",
      "intruder",
      "wrong-secret-pw",
      PASSWORD,
    ]) {
      expect(persisted).not.toContain(raw);
    }
    expect(lines.length).toBeGreaterThan(0);
  });

  it("still signs in when resetting the attempt counter fails, and logs it", async () => {
    const store = new InMemoryAttemptStore();
    store.clearAttempts = () => Promise.reject(new Error("mongo blip"));
    const { service, lines } = setup(store);
    const result = await service.login(attempt(PASSWORD));
    expect(result.ok).toBe(true);
    expect(lines.join("\n")).toContain("admin_login_attempts_reset_failed");
  });

  it("fails closed when the attempt store is unavailable", async () => {
    const broken: LoginAttemptStore = {
      registerAttempt: () => Promise.reject(new Error("mongo down")),
      clearAttempts: () => Promise.reject(new Error("mongo down")),
    };
    const { service } = setup(broken);
    await expect(service.login(attempt(PASSWORD))).rejects.toThrow(
      "mongo down",
    );
  });
});

describe("AdminAuthService.verifySession", () => {
  it.each([[undefined], [""], ["forged.token"]])("rejects %j", (token) => {
    const { service } = setup();
    expect(service.verifySession(token)).toBeNull();
  });

  it("rejects a session after it expires", async () => {
    const { service, advance } = setup();
    const result = await service.login(attempt(PASSWORD));
    if (!result.ok) throw new Error("login should succeed");
    advance(SESSION_TTL_MS);
    expect(service.verifySession(result.session.token)).toBeNull();
  });

  it("rejects a validly signed session for a different admin username", () => {
    const { service } = setup(undefined, "new-admin");
    const { token } = createSessionToken({
      subject: USERNAME,
      now: START,
      ttlMs: SESSION_TTL_MS,
      secret: SECRET,
    });
    expect(service.verifySession(token)).toBeNull();
  });
});
