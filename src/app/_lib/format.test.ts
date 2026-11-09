import { describe, expect, it } from "vitest";
import { formatCRC } from "./format";

// Intl uses narrow no-break spaces as thousands separators in es-CR.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatCRC", () => {
  it("formats integer colones with the ₡ sign and no decimals", () => {
    expect(plain(formatCRC(12_000))).toBe("₡12 000");
    expect(plain(formatCRC(1_250_500))).toBe("₡1 250 500");
    expect(plain(formatCRC(0))).toBe("₡0");
  });
});
