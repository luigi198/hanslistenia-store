import { describe, expect, it } from "vitest";
import { globalSingleton } from "./global-singleton";

describe("globalSingleton", () => {
  it("creates the value once per key and returns it on later calls", () => {
    let created = 0;
    const key = `test-${Math.random()}`;
    const a = globalSingleton(key, () => ({ n: ++created }));
    const b = globalSingleton(key, () => ({ n: ++created }));
    expect(a).toBe(b);
    expect(created).toBe(1);
  });

  it("does not cache when the factory throws", () => {
    const key = `test-${Math.random()}`;
    expect(() =>
      globalSingleton(key, () => {
        throw new Error("bad config");
      }),
    ).toThrow("bad config");
    expect(globalSingleton(key, () => "ok")).toBe("ok");
  });
});
