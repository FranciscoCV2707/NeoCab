import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { System } from "./types";

interface SystemStore {
  systems: System[];
  selectedSystem: System | null;
  loading: boolean;
  scanProgress: string;

  loadSystems: () => Promise<void>;
  selectSystem: (system: System) => void;
  setLoading: (loading: boolean) => void;
  setScanProgress: (msg: string) => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  systems: [],
  selectedSystem: null,
  loading: false,
  scanProgress: "",

  loadSystems: async () => {
    set({ loading: true });
    try {
      const dbSystems = await invoke<System[]>("list_systems");
      const virtualSystems: System[] = [
        { id: 9991, name: "virtual-all", display_name: "All Games", extensions: "" },
        { id: 9992, name: "virtual-favorites", display_name: "Favorites", extensions: "" },
        { id: 9993, name: "virtual-recent", display_name: "Recently Played", extensions: "" },
      ];
      set({ systems: [...virtualSystems, ...dbSystems] });
    } catch (error) {
      console.error("Failed to load systems:", error);
    } finally {
      set({ loading: false });
    }
  },

  selectSystem: (system: System) => {
    set({ selectedSystem: system });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setScanProgress: (msg: string) => set({ scanProgress: msg }),
}));
