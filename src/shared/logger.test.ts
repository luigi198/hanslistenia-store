import { describe, expect, it } from "vitest";
import { createLogger, REDACTED } from "./logger";

function capture(level: "debug" | "info" | "warn" | "error" = "debug") {
  const lines: string[] = [];
  const logger = createLogger({ level, write: (line) => lines.push(line) });
  const entries = () => lines.map((l) => JSON.parse(l));
  return { logger, lines, entries };
}

describe("logger", () => {
  it("writes one JSON line with level, msg, time and fields", () => {
    const { logger, lines, entries } = capture();
    logger.info("order_created", { orderCode: "HC-1042" });
    expect(lines).toHaveLength(1);
    const [entry] = entries();
    expect(entry).toMatchObject({
      level: "info",
      msg: "order_created",
      orderCode: "HC-1042",
    });
    expect(new Date(entry.time).toString()).not.toBe("Invalid Date");
  });

  it("drops entries below the configured level", () => {
    const { logger, lines } = capture("warn");
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");
    expect(lines).toHaveLength(2);
  });

  it("redacts sensitive keys at any depth, case-insensitively", () => {
    const { logger, lines, entries } = capture();
    logger.info("checkout", {
      orderId: "abc",
      buyer: {
        fullName: "Ana",
        Cedula: "1-2345-6789",
        phone: "8888-8888",
        email: "a@b.cr",
      },
      address: { distrito: "Carmen" },
      items: [{ trackingToken: "tok" }],
      authorization: "Bearer x",
    });
    const [entry] = entries();
    expect(entry.orderId).toBe("abc");
    expect(entry.buyer.fullName).toBe(REDACTED);
    expect(entry.buyer.Cedula).toBe(REDACTED);
    expect(entry.buyer.phone).toBe(REDACTED);
    expect(entry.buyer.email).toBe(REDACTED);
    expect(entry.address).toBe(REDACTED);
    expect(entry.items[0].trackingToken).toBe(REDACTED);
    expect(entry.authorization).toBe(REDACTED);
    for (const secret of [
      "1-2345-6789",
      "8888-8888",
      "a@b.cr",
      "Bearer x",
      "Carmen",
      "Ana",
    ]) {
      expect(lines[0]).not.toContain(secret);
    }
  });

  it("serializes errors with name, message and stack", () => {
    const { logger, entries } = capture();
    logger.error("upload_failed", {
      orderCode: "HC-1",
      error: new TypeError("boom"),
    });
    const [entry] = entries();
    expect(entry.error).toMatchObject({ name: "TypeError", message: "boom" });
    expect(entry.error.stack).toContain("boom");
  });

  it("handles circular references without throwing", () => {
    const { logger, entries } = capture();
    const node: Record<string, unknown> = { id: 1 };
    node.self = node;
    logger.info("cycle", { node });
    expect(entries()[0].node.self).toBe("[Circular]");
  });

  it("child loggers merge bound fields", () => {
    const { logger, entries } = capture();
    logger.child({ requestId: "r-1" }).warn("slow", { ms: 900 });
    expect(entries()[0]).toMatchObject({
      requestId: "r-1",
      ms: 900,
      level: "warn",
    });
  });
});

describe("logger serialization edge cases", () => {
  it("does not throw on BigInt and logs it as a string", () => {
    const { logger, entries } = capture();
    expect(() => logger.info("big", { count: 10n })).not.toThrow();
    expect(entries()[0].count).toBe("10");
  });

  it("honors toJSON (e.g. Mongo ObjectId logs as its hex id)", () => {
    const { logger, entries } = capture();
    const fakeObjectId = {
      i0: 1,
      i1: 2,
      toJSON: () => "65a1f0c2e4b0a1b2c3d4e5f6",
    };
    logger.info("order_created", { orderId: fakeObjectId });
    expect(entries()[0].orderId).toBe("65a1f0c2e4b0a1b2c3d4e5f6");
  });

  it("serializes Map and Set", () => {
    const { logger, entries } = capture();
    logger.info("collections", { m: new Map([["a", 1]]), s: new Set([1, 2]) });
    expect(entries()[0]).toMatchObject({ m: { a: 1 }, s: [1, 2] });
  });

  it("keeps a shared (non-circular) reference that appears twice", () => {
    const { logger, entries } = capture();
    const meta = { status: "pago_confirmado" };
    logger.info("status_changed", {
      before: meta,
      after: meta,
      list: [meta, meta],
    });
    const [entry] = entries();
    expect(entry.after).toEqual(meta);
    expect(entry.list).toEqual([meta, meta]);
  });

  it("keeps error code and cause, and scrubs emails and ID/phone numbers from messages", () => {
    const { logger, lines, entries } = capture();
    const cause = new Error("socket closed");
    const error = Object.assign(
      new Error(
        'E11000 dup key: { email: "a@b.cr", cedula: "1-2345-6789" } tel 8888-8888',
      ),
      { code: 11000, cause },
    );
    logger.error("insert_failed", { error });
    const [entry] = entries();
    expect(entry.error.code).toBe(11000);
    expect(entry.error.cause.message).toBe("socket closed");
    for (const secret of ["a@b.cr", "1-2345-6789", "8888-8888"]) {
      expect(lines[0]).not.toContain(secret);
    }
  });

  it.each([
    ["name"],
    ["firstName"],
    ["lastName"],
    ["buyerName"],
    ["cédula"],
    ["dirección"],
    ["señas"],
    ["accessKeyId"],
    ["credentials"],
    ["uri"],
    ["connectionString"],
  ])("redacts key %s", (key) => {
    const { logger, entries } = capture();
    logger.info("k", { [key]: "sensitive-value" });
    expect(entries()[0][key]).toBe(REDACTED);
  });

  it("does not redact ordinary keys that merely contain 'uri' or 'name' fragments", () => {
    const { logger, entries } = capture();
    logger.info("k", {
      security: "ok",
      productName: "Camiseta",
      orderCode: "HC-1",
    });
    expect(entries()[0]).toMatchObject({
      security: "ok",
      productName: "Camiseta",
      orderCode: "HC-1",
    });
  });
});
