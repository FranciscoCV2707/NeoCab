import { describe, it, expect, beforeEach } from "vitest";
import { rawT, t, setLocale, getLocale } from "../i18n";

describe("i18n", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("returns English by default", () => {
    expect(getLocale()).toBe("en");
  });

  it("translates known keys in English", () => {
    expect(rawT("en", "menu.play")).toBe("PLAY ARCADE");
  });

  it("translates known keys in Spanish", () => {
    expect(rawT("es", "menu.play")).toBe("JUGAR ARCADE");
  });

  it("translates known keys in French", () => {
    expect(rawT("fr", "menu.play")).toBe("JOUER ARCADE");
  });

  it("translates known keys in German", () => {
    expect(rawT("de", "menu.play")).toBe("ARCADE SPIELEN");
  });

  it("translates known keys in Portuguese", () => {
    expect(rawT("pt-br", "menu.play")).toBe("JOGAR ARCADE");
  });

  it("falls back to English for missing key in other language", () => {
    expect(rawT("es", "menu.play")).toBe("JUGAR ARCADE");
  });

  it("returns key as-is if not found in any language", () => {
    expect(t("NONEXISTENT_KEY")).toBe("NONEXISTENT_KEY");
  });

  it("interpolates variables", () => {
    expect(rawT("en", "menu.loading")).toBe("Loading...");
  });

  it("supports backward-compatible old keys", () => {
    expect(t("PLAY_ARCADE")).toBe("PLAY ARCADE");
    expect(t("BACK")).toBe("BACK");
  });
});
