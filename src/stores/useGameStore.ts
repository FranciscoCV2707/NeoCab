import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Game, System, SortField, SortOrder } from "./types";

interface GameStore {
  games: Game[];
  focusedIndex: number;
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  filterGenre: string;
  filterYear: string;
  filterFavorites: boolean;

  loadGames: (systemName: string, search?: string) => Promise<void>;
  setFocusedIndex: (index: number) => void;
  setSearchQuery: (q: string) => void;
  setSortField: (f: SortField) => void;
  setSortOrder: (o: SortOrder) => void;
  setFilterGenre: (g: string) => void;
  setFilterYear: (y: string) => void;
  setFilterFavorites: (f: boolean) => void;
  clearFilters: () => void;
  enrichGames: (systemName: string, games: Game[]) => Promise<Game[]>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  focusedIndex: 0,
  searchQuery: "",
  sortField: "title",
  sortOrder: "asc",
  filterGenre: "",
  filterYear: "",
  filterFavorites: false,

  loadGames: async (systemName: string, search?: string) => {
    set({ loading: true } as any);  // Will be removed when we refactor
    try {
      const dbGames = await invoke<Game[]>("list_games", {
        system: systemName,
        search: search || undefined,
      });

      const enrichedGames = await get().enrichGames(systemName, dbGames);
      set({ games: enrichedGames, focusedIndex: 0 });
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      set({ loading: false } as any);
    }
  },

  enrichGames: async (systemName: string, games: Game[]): Promise<Game[]> => {
    return Promise.all(games.map(async (game) => {
      try {
        const gameName = (game.filename || game.title || "").replace(/\.[^/.]+$/, "");
        const mediaResult = await invoke<string>("get_all_game_media", {
          system: systemName,
          gameName,
        });
        const media = JSON.parse(mediaResult).media;
        return {
          ...game,
          image_path: media.box_art || media.screenshot || game.image_path,
          video_path: media.video || game.video_path,
          wheel_path: media.wheel || game.wheel_path,
          marquee_path: media.marquee || game.marquee_path,
        };
      } catch {
        return game;
      }
    }));
  },

  setFocusedIndex: (index: number) => set({ focusedIndex: index }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setSortField: (f: SortField) => set({ sortField: f }),
  setSortOrder: (o: SortOrder) => set({ sortOrder: o }),
  setFilterGenre: (g: string) => set({ filterGenre: g }),
  setFilterYear: (y: string) => set({ filterYear: y }),
  setFilterFavorites: (f: boolean) => set({ filterFavorites: f }),

  clearFilters: () => set({
    filterGenre: "",
    filterYear: "",
    filterFavorites: false,
    sortField: "title",
    sortOrder: "asc",
  }),
}));
