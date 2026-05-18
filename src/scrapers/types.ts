export type ScraperProvider = 'screenscraper' | 'thegamesdb' | 'igdb' | 'moby' | 'local';

export interface ScraperConfig {
  provider: ScraperProvider;
  username?: string;
  password?: string;
  apiKey?: string;
  priority: number;
  enabled: boolean;
}

export interface GameMetadata {
  id: string;
  provider: ScraperProvider;
  title: string;
  year?: number;
  system?: string;
  genres: string[];
  developer?: string;
  publisher?: string;
  description?: string;
  players?: number;
  rating?: number;
  images: GameImages;
  videos: string[];
  hash?: string;
}

export interface GameImages {
  boxFront?: string;
  boxBack?: string;
  screenshot?: string;
  marquee?: string;
  wheel?: string;
  titleScreen?: string;
  fanart?: string;
  banner?: string;
}

export interface ScraperSearchResult {
  provider: ScraperProvider;
  gameId: string;
  title: string;
  year?: number;
  system?: string;
  description?: string;
  image?: string;
  score: number;
}

export interface BatchScrapeOptions {
  gameIds: number[];
  providers?: ScraperProvider[];
  mediaTypes: MediaType[];
  onProgress?: (completed: number, total: number, currentGame: string) => void;
}

export type MediaType = 'marquee' | 'wheel' | 'box' | 'screenshot' | 'video' | 'title';

export interface ScrapeResult {
  gameId: number;
  success: boolean;
  images: Partial<GameImages>;
  error?: string;
}

export interface ProviderInfo {
  id: ScraperProvider;
  name: string;
  priority: number;
  requiresAuth: boolean;
  supportedSystems: string[];
  rateLimit?: number;
  baseUrl?: string;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  provider: 'thegamesdb',
  priority: 100,
  enabled: true,
};

export const PROVIDER_INFO: Record<ScraperProvider, ProviderInfo> = {
  screenscraper: {
    id: 'screenscraper',
    name: 'ScreenScraper',
    priority: 10,
    requiresAuth: true,
    supportedSystems: ['arcade', 'neogeo', 'cps', 'sf', 'tmnt', 'finalfight', 'segastv'],
    rateLimit: 2000,
    baseUrl: 'https://www.screenscraper.fr',
  },
  thegamesdb: {
    id: 'thegamesdb',
    name: 'TheGamesDB',
    priority: 20,
    requiresAuth: false,
    supportedSystems: ['arcade', 'neogeo', 'cps', 'sf'],
    rateLimit: 1000,
    baseUrl: 'https://api.thegamesdb.net',
  },
  igdb: {
    id: 'igdb',
    name: 'IGDB',
    priority: 30,
    requiresAuth: true,
    supportedSystems: ['arcade', 'neogeo', 'sf'],
    rateLimit: 500,
    baseUrl: 'https://api.igdb.com',
  },
  moby: {
    id: 'moby',
    name: 'MobyGames',
    priority: 40,
    requiresAuth: false,
    supportedSystems: ['arcade'],
    rateLimit: 1000,
    baseUrl: 'https://www.mobygames.com',
  },
  local: {
    id: 'local',
    name: 'Local Files',
    priority: 5,
    requiresAuth: false,
    supportedSystems: ['arcade', 'neogeo', 'cps', 'sf', 'tmnt', 'finalfight', 'segastv'],
  },
};