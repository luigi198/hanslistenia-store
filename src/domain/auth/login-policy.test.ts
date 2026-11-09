import { describe, expect, it } from "vitest";
import { clientNetwork, lockoutMinutes } from "./login-policy";

describe("clientNetwork", () => {
  it.each([
    ["203.0.113.7", "203.0.113.7"],
    ["2001:db8:1:2::1", "2001:db8:1:2::/64"],
    ["2001:0db8:0001:0002:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64"],
    ["2001:DB8:1:2:ffff::9", "2001:db8:1:2::/64"],
    ["::1", "0:0:0:0::/64"],
    ["::ffff:203.0.113.7", "203.0.113.7"],
  ])("maps %s to %s", (ip, network) => {
    expect(clientNetwork(ip)).toBe(network);
  });

  it("passes through values that are not IP addresses", () => {
    expect(clientNetwork("unknown")).toBe("unknown");
  });
});

describe("lockoutMinutes", () => {
  it("is the attempt window in whole minutes", () => {
    expect(lockoutMinutes()).toBe(15);
  });
});
