import { describe, expect, it } from "vitest";
import { slideAt } from "./slide-index";

describe("slideAt", () => {
  it("is the slide whose start is nearest the scroll position", () => {
    expect(slideAt(0, 400, 3)).toBe(0);
    expect(slideAt(400, 400, 3)).toBe(1);
    expect(slideAt(590, 400, 3)).toBe(1);
    expect(slideAt(610, 400, 3)).toBe(2);
  });

  it("stays within the slides when the scroll overshoots", () => {
    expect(slideAt(-50, 400, 3)).toBe(0);
    expect(slideAt(5000, 400, 3)).toBe(2);
  });

  it("is the first slide before the carousel has a width", () => {
    expect(slideAt(120, 0, 3)).toBe(0);
  });

  it("is the first slide when there are no slides", () => {
    expect(slideAt(400, 400, 0)).toBe(0);
  });
});
