import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { View, Game, SaveState } from "./types";

interface FadeInfo {
  game: string;
  system: string;
}

interface UIStore {
  currentView: View;
  fadeVisible: boolean;
  pauseVisible: boolean;
  attractMode: boolean;
  showSaveStateModal: boolean;
  pendingGame: Game | null;
  saveStatesList: SaveState[];
  fadeInfo: FadeInfo;
  fadeConfig: any;

  setView: (view: View) => void;
  setFadeVisible: (v: boolean) => void;
  setPauseVisible: (v: boolean) => void;
  togglePause: () => void;
  setAttractMode: (v: boolean) => void;
  setShowSaveStateModal: (v: boolean) => void;
  setPendingGame: (g: Game | null) => void;
  setSaveStatesList: (list: SaveState[]) => void;
  setFadeInfo: (info: FadeInfo) => void;
  showSaveStateForGame: (game: Game, states: SaveState[]) => void;
  hideSaveStateModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: "menu",
  fadeVisible: false,
  pauseVisible: false,
  attractMode: false,
  showSaveStateModal: false,
  pendingGame: null,
  saveStatesList: [],
  fadeInfo: { game: "", system: "" },
  fadeConfig: null,

  setView: (view: View) => set({ currentView: view }),
  setFadeVisible: (v: boolean) => set({ fadeVisible: v }),
  setPauseVisible: (v: boolean) => set({ pauseVisible: v }),
  togglePause: () => set((s) => ({ pauseVisible: !s.pauseVisible })),
  setAttractMode: (v: boolean) => set({ attractMode: v }),
  setShowSaveStateModal: (v: boolean) => set({ showSaveStateModal: v }),
  setPendingGame: (g: Game | null) => set({ pendingGame: g }),
  setSaveStatesList: (list: SaveState[]) => set({ saveStatesList: list }),
  setFadeInfo: (info: FadeInfo) => set({ fadeInfo: info }),

  showSaveStateForGame: (game: Game, states: SaveState[]) => set({
    pendingGame: game,
    saveStatesList: states,
    showSaveStateModal: true,
  }),

  hideSaveStateModal: () => set({
    showSaveStateModal: false,
    pendingGame: null,
    saveStatesList: [],
  }),
}));

// Initialize Tauri event listeners (call once)
export function initUIListeners() {
  listen("toggle_pause_menu", () => {
    useUIStore.getState().togglePause();
  });

  listen("game_launch_start", (event: any) => {
    useUIStore.getState().setFadeInfo({
      game: event.payload.game,
      system: event.payload.system,
    });
    useUIStore.getState().setFadeVisible(true);
    useUIStore.getState().setPauseVisible(false);
  });

  listen("game_launch_ready", () => {
    setTimeout(() => useUIStore.getState().setFadeVisible(false), 1000);
  });
}
