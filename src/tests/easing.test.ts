import { describe, it, expect } from "vitest";
import { easing, getEasingCSS } from "../utils/easing";

describe("easing functions", () => {
  it("linear returns t unchanged", () => {
    expect(easing.linear(0)).toBe(0);
    expect(easing.linear(0.5)).toBe(0.5);
    expect(easing.linear(1)).toBe(1);
  });

  it("easeInQuad starts slow", () => {
    expect(easing.easeInQuad(0)).toBe(0);
    expect(easing.easeInQuad(0.5)).toBe(0.25);
    expect(easing.easeInQuad(1)).toBe(1);
  });

  it("easeOutQuad ends slow", () => {
    expect(easing.easeOutQuad(0)).toBe(0);
    expect(easing.easeOutQuad(0.5)).toBe(0.75);
    expect(easing.easeOutQuad(1)).toBe(1);
  });

  it("easeOutBack overshoots", () => {
    expect(easing.easeOutBack(0)).toBeCloseTo(0, 10);
    expect(easing.easeOutBack(1)).toBeGreaterThan(0.9);
    expect(easing.easeOutBack(1)).toBe(1);
  });

  it("all functions return 0 at t=0 and 1 at t=1", () => {
    for (const [name, fn] of Object.entries(easing)) {
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 5);
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 5);
    }
  });
});

describe("getEasingCSS", () => {
  it("returns cubic-bezier for known names", () => {
    expect(getEasingCSS("easeOutCubic")).toContain("cubic-bezier");
    expect(getEasingCSS("linear")).toContain("cubic-bezier");
  });

  it("falls back to linear for unknown names", () => {
    expect(getEasingCSS("nonexistent")).toBe(getEasingCSS("linear"));
  });
});
