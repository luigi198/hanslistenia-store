import { describe, expect, it } from "vitest";
import { parseLoginInput } from "./login-input";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseLoginInput", () => {
  it("returns username and password from the form", () => {
    expect(parseLoginInput(form({ username: "hans", password: "pw" }))).toEqual(
      {
        username: "hans",
        password: "pw",
      },
    );
  });

  it.each([
    [{ username: "", password: "pw" }],
    [{ username: "hans", password: "" }],
    [{ username: "hans" }],
    [{ username: "hans", password: "x".repeat(1025) }],
  ])("rejects missing, empty or oversized fields: %j", (fields) => {
    expect(parseLoginInput(form(fields))).toBeNull();
  });
});
