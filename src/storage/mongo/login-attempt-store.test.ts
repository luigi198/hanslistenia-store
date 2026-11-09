import { randomUUID } from "node:crypto";
import { MongoClient, type Db } from "mongodb";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import {
  LOGIN_ATTEMPTS_COLLECTION,
  MongoLoginAttemptStore,
} from "./login-attempt-store";

// Integration test against a real MongoDB, provided by
// test-support/vitest-global-setup.ts (Docker, or MONGODB_TEST_URI).
const WINDOW_MS = 15 * 60 * 1000;
const T0 = new Date("2026-11-08T12:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);

describe("MongoLoginAttemptStore (integration)", () => {
  let client: MongoClient;
  let db: Db;
  let store: MongoLoginAttemptStore;

  beforeAll(async () => {
    client = await new MongoClient(inject("mongoUri")).connect();
    db = client.db(`hl_test_${randomUUID().slice(0, 8)}`);
    store = new MongoLoginAttemptStore(async () => db);
  });

  afterAll(async () => {
    await db?.dropDatabase();
    await client?.close();
  });

  it("returns the running count within a window, per key", async () => {
    expect(await store.registerAttempt("k1", at(0), WINDOW_MS)).toBe(1);
    expect(await store.registerAttempt("k1", at(1000), WINDOW_MS)).toBe(2);
    expect(await store.registerAttempt("other", at(1000), WINDOW_MS)).toBe(1);
  });

  it("restarts at 1 once the window closes, even before the TTL monitor runs", async () => {
    await store.registerAttempt("k2", at(0), WINDOW_MS);
    await store.registerAttempt("k2", at(1), WINDOW_MS);
    expect(await store.registerAttempt("k2", at(WINDOW_MS), WINDOW_MS)).toBe(1);
    expect(
      await store.registerAttempt("k2", at(WINDOW_MS + 1), WINDOW_MS),
    ).toBe(2);
  });

  it("counts concurrent attempts exactly, each caller seeing a distinct number", async () => {
    const counts = await Promise.all(
      Array.from({ length: 10 }, () =>
        store.registerAttempt("k3", at(0), WINDOW_MS),
      ),
    );
    expect([...counts].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("clears attempts for a key", async () => {
    await store.registerAttempt("k4", at(0), WINDOW_MS);
    await store.clearAttempts("k4");
    expect(await store.registerAttempt("k4", at(1), WINDOW_MS)).toBe(1);
  });

  it("creates a TTL index so closed windows are deleted", async () => {
    await store.registerAttempt("k5", at(0), WINDOW_MS);
    const indexes = await db.collection(LOGIN_ATTEMPTS_COLLECTION).indexes();
    expect(indexes).toContainEqual(
      expect.objectContaining({ key: { expiresAt: 1 }, expireAfterSeconds: 0 }),
    );
  });

  it("propagates database errors to the caller", async () => {
    const broken = new MongoLoginAttemptStore(() =>
      Promise.reject(new Error("ECONNREFUSED")),
    );
    await expect(
      broken.registerAttempt("k6", at(0), WINDOW_MS),
    ).rejects.toThrow("ECONNREFUSED");
  });
});
