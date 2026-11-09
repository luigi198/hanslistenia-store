import { describe, expect, it, vi } from "vitest";
import { memoizeUntilSuccess } from "./memoize-until-success";

type FakeClient = { id: number };

describe("memoizeUntilSuccess", () => {
  it("connects once and returns the same client on repeated and concurrent calls", async () => {
    let created = 0;
    const connect = vi.fn(async (): Promise<FakeClient> => ({ id: ++created }));
    const getClient = memoizeUntilSuccess(connect);

    const [a, b] = await Promise.all([getClient(), getClient()]);
    const c = await getClient();

    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(created).toBe(1);
  });

  it("propagates a connection failure and retries on the next call", async () => {
    let attempt = 0;
    const getClient = memoizeUntilSuccess(async (): Promise<FakeClient> => {
      attempt += 1;
      if (attempt === 1) throw new Error("ECONNREFUSED");
      return { id: attempt };
    });

    await expect(getClient()).rejects.toThrow("ECONNREFUSED");
    await expect(getClient()).resolves.toEqual({ id: 2 });
  });
});
