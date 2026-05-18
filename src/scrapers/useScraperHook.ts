import { useCallback } from 'react';
import { useScraperStore } from '../stores/useScraperStore';
import type { ScraperProvider, GameMetadata, ScraperSearchResult, MediaType } from './types';

export function useScraper() {
  const {
    configs,
    activeProvider,
    searchResults,
    isSearching,
    isScraping,
    scrapeProgress,
    lastError,
    setConfig,
    setActiveProvider,
    search,
    getMetadata,
    batchScrape,
    clearSearch,
    clearError,
  } = useScraperStore();

  const searchGames = useCallback(
    async (query: string, system?: string): Promise<ScraperSearchResult[]> => {
      return search(query, system);
    },
    [search]
  );

  const scrapeGame = useCallback(
    async (gameId: string): Promise<GameMetadata | null> => {
      return getMetadata(gameId);
    },
    [getMetadata]
  );

  const scrapeMultiple = useCallback(
    async (
      gameIds: number[],
      mediaTypes: MediaType[] = ['marquee', 'wheel', 'box'],
      providers?: ScraperProvider[]
    ) => {
      return batchScrape({
        gameIds,
        providers,
        mediaTypes,
        onProgress: (completed, total, currentGame) => {
          console.log(`[Scraper] ${completed}/${total}: ${currentGame}`);
        },
      });
    },
    [batchScrape]
  );

  const updateProviderConfig = useCallback(
    (provider: ScraperProvider, config: Partial<typeof configs[ScraperProvider]>) => {
      setConfig(provider, config);
    },
    [setConfig]
  );

  return {
    configs,
    activeProvider,
    searchResults,
    isSearching,
    isScraping,
    scrapeProgress,
    lastError,
    searchGames,
    scrapeGame,
    scrapeMultiple,
    setActiveProvider,
    updateProviderConfig,
    clearSearch,
    clearError,
  };
}

export function useScraperConfig(provider: ScraperProvider) {
  const { configs, setConfig } = useScraperStore();
  const config = configs[provider];

  const update = useCallback(
    (updates: Partial<typeof config>) => {
      setConfig(provider, updates);
    },
    [provider, setConfig]
  );

  const enable = useCallback(() => {
    setConfig(provider, { enabled: true });
  }, [provider, setConfig]);

  const disable = useCallback(() => {
    setConfig(provider, { enabled: false });
  }, [provider, setConfig]);

  return { config, update, enable, disable };
}