import { describe, it, expect, beforeEach, vi } from "vitest";
import { useScraperStore } from "../stores/useScraperStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("useScraperStore", () => {
  beforeEach(() => {
    useScraperStore.setState({
      configs: {
        screenscraper: { provider: "screenscraper", priority: 10, enabled: false },
        thegamesdb: { provider: "thegamesdb", priority: 20, enabled: true },
        igdb: { provider: "igdb", priority: 30, enabled: false },
        moby: { provider: "moby", priority: 40, enabled: false },
        local: { provider: "local", priority: 5, enabled: true },
      },
      activeProvider: "thegamesdb",
      searchResults: [],
      isSearching: false,
      isScraping: false,
      scrapeProgress: { completed: 0, total: 0, current: "" },
      lastError: null,
    });
  });

  it("has correct default providers", () => {
    const { configs } = useScraperStore.getState();
    expect(configs.screenscraper.enabled).toBe(false);
    expect(configs.thegamesdb.enabled).toBe(true);
    expect(configs.local.enabled).toBe(true);
  });

  it("sets active provider", () => {
    useScraperStore.getState().setActiveProvider("screenscraper");
    expect(useScraperStore.getState().activeProvider).toBe("screenscraper");
  });

  it("updates provider config", () => {
    useScraperStore.getState().setConfig("thegamesdb", { enabled: false });
    expect(useScraperStore.getState().configs.thegamesdb.enabled).toBe(false);
  });

  it("clears search results", () => {
    useScraperStore.setState({ searchResults: [{ gameId: "1", title: "Test", provider: "screenscraper", score: 0 }] });
    useScraperStore.getState().clearSearch();
    expect(useScraperStore.getState().searchResults).toEqual([]);
  });

  it("clears error", () => {
    useScraperStore.setState({ lastError: "Some error" });
    useScraperStore.getState().clearError();
    expect(useScraperStore.getState().lastError).toBe(null);
  });
});