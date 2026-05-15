import { describe, it, expect } from "vitest";
import { getTokenValue, parseTokens, registerTokenFunction } from "../utils/tokens";
import { Game } from "../stores/types";

const mockGame: Game = {
  id: 1, title: "Super Mario Bros", system_id: 1, rom_path: "/roms/mario.nes",
  year: 1985, developer: "Nintendo", publisher: "Nintendo",
  genre: "Platformer", players: 2, rating: 4.5,
  play_count: 100, total_play_time: 3600, is_favorite: 1,
  last_played: "2026-05-10",
  description: "A classic platformer",
  filename: "mario.nes", crc32: "abc123",
};

describe("getTokenValue", () => {
  it("returns game title for [Title]", () => {
    expect(getTokenValue("Title", mockGame)).toBe("Super Mario Bros");
  });

  it("returns year for [Year]", () => {
    expect(getTokenValue("Year", mockGame)).toBe("1985");
  });

  it("returns favorite star", () => {
    expect(getTokenValue("Favourite", mockGame)).toBe("★");
  });

  it("returns empty for unknown token", () => {
    expect(getTokenValue("Unknown", mockGame)).toBe("[Unknown]");
  });
});

describe("parseTokens", () => {
  it("replaces tokens in a string", () => {
    const result = parseTokens("[Title] - [Year]", mockGame);
    expect(result).toBe("Super Mario Bros - 1985");
  });

  it("handles multiple tokens", () => {
    const result = parseTokens("[Developer] made [Title]", mockGame);
    expect(result).toBe("Nintendo made Super Mario Bros");
  });
});

describe("registerTokenFunction", () => {
  it("registers and calls custom function", () => {
    registerTokenFunction("test_fn", (game, _args) => `FN:${game.title}`);
    const result = parseTokens("[!test_fn]", mockGame);
    expect(result).toBe("FN:Super Mario Bros");
  });
});
