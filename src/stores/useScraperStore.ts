import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  ScraperConfig,
  ScraperProvider,
  ScraperSearchResult,
  GameMetadata,
  BatchScrapeOptions,
  ScrapeResult,
} from '../scrapers/types';

interface ScraperState {
  configs: Record<ScraperProvider, ScraperConfig>;
  activeProvider: ScraperProvider;
  searchResults: ScraperSearchResult[];
  isSearching: boolean;
  isScraping: boolean;
  scrapeProgress: { completed: number; total: number; current: string };
  lastError: string | null;
}

interface ScraperActions {
  setConfig: (provider: ScraperProvider, config: Partial<ScraperConfig>) => void;
  setActiveProvider: (provider: ScraperProvider) => void;
  search: (query: string, system?: string) => Promise<ScraperSearchResult[]>;
  getMetadata: (gameId: string, provider?: ScraperProvider) => Promise<GameMetadata | null>;
  batchScrape: (options: BatchScrapeOptions) => Promise<ScrapeResult[]>;
  clearSearch: () => void;
  clearError: () => void;
}

const defaultConfigs: Record<ScraperProvider, ScraperConfig> = {
  screenscraper: { provider: 'screenscraper', priority: 10, enabled: false },
  thegamesdb: { provider: 'thegamesdb', priority: 20, enabled: true },
  igdb: { provider: 'igdb', priority: 30, enabled: false },
  moby: { provider: 'moby', priority: 40, enabled: false },
  local: { provider: 'local', priority: 5, enabled: true },
};

export const useScraperStore = create<ScraperState & ScraperActions>((set, get) => ({
  configs: defaultConfigs,
  activeProvider: 'thegamesdb',
  searchResults: [],
  isSearching: false,
  isScraping: false,
  scrapeProgress: { completed: 0, total: 0, current: '' },
  lastError: null,

  setConfig: (provider, config) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [provider]: { ...state.configs[provider], ...config },
      },
    }));
  },

  setActiveProvider: (provider) => set({ activeProvider: provider }),

  search: async (query, system) => {
    set({ isSearching: true, lastError: null });
    try {
      const result = await invoke<string>('scraper_search', { query, system });
      const data = JSON.parse(result);
      const results: ScraperSearchResult[] = data.results || [];
      set({ searchResults: results, isSearching: false });
      return results;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      set({ lastError: error, isSearching: false });
      return [];
    }
  },

  getMetadata: async (gameId, provider) => {
    try {
      const result = await invoke<string>('scraper_get_metadata', {
        gameId,
        provider: provider || get().activeProvider,
      });
      const data = JSON.parse(result);
      return data as GameMetadata;
    } catch {
      return null;
    }
  },

  batchScrape: async (options) => {
    set({
      isScraping: true,
      lastError: null,
      scrapeProgress: { completed: 0, total: options.gameIds.length, current: '' },
    });

    const results: ScrapeResult[] = [];
    const total = options.gameIds.length;

    for (let i = 0; i < total; i++) {
      const gameId = options.gameIds[i];
      const current = `Game ${i + 1}/${total}`;
      set((state) => ({
        scrapeProgress: { ...state.scrapeProgress, completed: i, current },
      }));

      options.onProgress?.(i, total, current);

      try {
        const result = await invoke<string>('scraper_batch_scrape', {
          gameIds: [gameId],
          providers: options.providers,
          mediaTypes: options.mediaTypes,
        });
        const data = JSON.parse(result);
        results.push({ gameId, success: true, images: data.images || {} });
      } catch (e) {
        results.push({
          gameId,
          success: false,
          images: {},
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    set({ isScraping: false, scrapeProgress: { completed: total, total, current: '' } });
    return results;
  },

  clearSearch: () => set({ searchResults: [] }),
  clearError: () => set({ lastError: null }),
}));