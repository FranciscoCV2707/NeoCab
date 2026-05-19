import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { System } from "./types";

// ─── Views / Filters ───────────────────────────────────────────────────────────

export type FilterField = "genre" | "rating" | "favorite" | "players" | "year" | "platform";
export type FilterOp = "eq" | "gte" | "lte" | "contains";

export interface ViewFilter {
  field: FilterField;
  op: FilterOp;
  value: string | number | boolean;
}

export interface UserView {
  id: string;
  name: string;
  /** Virtual system id used for navigation. Range 8000–8999. */
  systemId: number;
  filters: ViewFilter[];
}

const VIEWS_KEY = "neocab_user_views";

function loadStoredViews(): UserView[] {
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveViews(views: UserView[]) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

function viewsToSystems(views: UserView[]): System[] {
  return views.map((v) => ({
    id: v.systemId,
    name: `view-${v.id}`,
    display_name: v.name,
    extensions: "",
  }));
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface SystemStore {
  systems: System[];
  selectedSystem: System | null;
  loading: boolean;
  scanProgress: string;
  userViews: UserView[];
  activeViewId: string | null;

  loadSystems: () => Promise<void>;
  selectSystem: (system: System) => void;
  setLoading: (loading: boolean) => void;
  setScanProgress: (msg: string) => void;

  addView: (name: string, filters: ViewFilter[]) => UserView;
  updateView: (id: string, patch: Partial<Pick<UserView, "name" | "filters">>) => void;
  removeView: (id: string) => void;
  setActiveView: (id: string | null) => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  systems: [],
  selectedSystem: null,
  loading: false,
  scanProgress: "",
  userViews: loadStoredViews(),
  activeViewId: null,

  loadSystems: async () => {
    set({ loading: true });
    try {
      const dbSystems = await invoke<System[]>("list_systems");
      const { userViews } = get();

      const builtinVirtual: System[] = [
        { id: 9991, name: "virtual-all", display_name: "All Games", extensions: "" },
        { id: 9992, name: "virtual-favorites", display_name: "Favorites", extensions: "" },
        { id: 9993, name: "virtual-recent", display_name: "Recently Played", extensions: "" },
      ];

      set({ systems: [...builtinVirtual, ...viewsToSystems(userViews), ...dbSystems] });
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

  addView: (name, filters) => {
    const id = crypto.randomUUID();
    // Assign a unique systemId in the 8000–8999 range
    const existingIds = get().userViews.map((v) => v.systemId);
    const systemId = Math.max(8000, ...existingIds) + 1;
    const view: UserView = { id, name, systemId, filters };
    const userViews = [...get().userViews, view];
    saveViews(userViews);
    const { systems } = get();
    set({ userViews, systems: [...systems, ...viewsToSystems([view])] });
    return view;
  },

  updateView: (id, patch) => {
    const userViews = get().userViews.map((v) => (v.id === id ? { ...v, ...patch } : v));
    saveViews(userViews);
    const dbSystems = get().systems.filter((s) => !s.name.startsWith("view-"));
    set({ userViews, systems: [...dbSystems, ...viewsToSystems(userViews)] });
  },

  removeView: (id) => {
    const userViews = get().userViews.filter((v) => v.id !== id);
    saveViews(userViews);
    const systems = get().systems.filter((s) => s.name !== `view-${id}`);
    set({ userViews, systems });
  },

  setActiveView: (id) => set({ activeViewId: id }),
}));
