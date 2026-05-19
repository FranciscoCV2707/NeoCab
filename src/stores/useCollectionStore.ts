import { create } from "zustand";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CollectionType = "manual" | "auto";

export interface AutoRule {
  field: "genre" | "rating" | "year" | "players" | "system";
  op: "eq" | "contains" | "gte" | "lte";
  value: string | number;
}

export interface Collection {
  id: string;
  name: string;
  type: CollectionType;
  /** Game IDs for manual collections. */
  gameIds: number[];
  /** Rules evaluated at runtime for auto collections. */
  rules: AutoRule[];
  /** Show as a virtual system in the main menu. */
  showInMenu: boolean;
  /** Virtual system id (range 7000–7999) when showInMenu is true. */
  systemId: number;
}

// ─── Persistence ───────────────────────────────────────────────────────────────

const COLLECTIONS_KEY = "neocab_collections";

function load(): Collection[] {
  try {
    return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(collections: Collection[]) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

function nextSystemId(collections: Collection[]): number {
  const ids = collections.filter((c) => c.showInMenu).map((c) => c.systemId);
  return Math.max(7000, ...ids) + 1;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface CollectionStore {
  collections: Collection[];

  createManual: (name: string, showInMenu?: boolean) => Collection;
  createAuto: (name: string, rules: AutoRule[], showInMenu?: boolean) => Collection;
  deleteCollection: (id: string) => void;
  addGame: (collectionId: string, gameId: number) => void;
  removeGame: (collectionId: string, gameId: number) => void;
  renameCollection: (id: string, name: string) => void;
  setShowInMenu: (id: string, show: boolean) => void;
  /** Evaluate auto-rules against a game object and return matching collection ids. */
  matchGame: (game: Record<string, unknown>) => string[];
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  collections: load(),

  createManual: (name, showInMenu = false) => {
    const id = crypto.randomUUID();
    const col: Collection = {
      id,
      name,
      type: "manual",
      gameIds: [],
      rules: [],
      showInMenu,
      systemId: showInMenu ? nextSystemId(get().collections) : 0,
    };
    const collections = [...get().collections, col];
    save(collections);
    set({ collections });
    return col;
  },

  createAuto: (name, rules, showInMenu = false) => {
    const id = crypto.randomUUID();
    const col: Collection = {
      id,
      name,
      type: "auto",
      gameIds: [],
      rules,
      showInMenu,
      systemId: showInMenu ? nextSystemId(get().collections) : 0,
    };
    const collections = [...get().collections, col];
    save(collections);
    set({ collections });
    return col;
  },

  deleteCollection: (id) => {
    const collections = get().collections.filter((c) => c.id !== id);
    save(collections);
    set({ collections });
  },

  addGame: (collectionId, gameId) => {
    const collections = get().collections.map((c) => {
      if (c.id !== collectionId || c.type !== "manual") return c;
      if (c.gameIds.includes(gameId)) return c;
      return { ...c, gameIds: [...c.gameIds, gameId] };
    });
    save(collections);
    set({ collections });
  },

  removeGame: (collectionId, gameId) => {
    const collections = get().collections.map((c) => {
      if (c.id !== collectionId) return c;
      return { ...c, gameIds: c.gameIds.filter((id) => id !== gameId) };
    });
    save(collections);
    set({ collections });
  },

  renameCollection: (id, name) => {
    const collections = get().collections.map((c) =>
      c.id === id ? { ...c, name } : c
    );
    save(collections);
    set({ collections });
  },

  setShowInMenu: (id, show) => {
    const collections = get().collections.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        showInMenu: show,
        systemId: show && !c.systemId ? nextSystemId(get().collections) : c.systemId,
      };
    });
    save(collections);
    set({ collections });
  },

  matchGame: (game) => {
    return get()
      .collections.filter((c) => c.type === "auto")
      .filter((c) =>
        c.rules.every((rule) => {
          const val = game[rule.field];
          if (val === undefined || val === null) return false;
          switch (rule.op) {
            case "eq":
              return String(val).toLowerCase() === String(rule.value).toLowerCase();
            case "contains":
              return String(val).toLowerCase().includes(String(rule.value).toLowerCase());
            case "gte":
              return Number(val) >= Number(rule.value);
            case "lte":
              return Number(val) <= Number(rule.value);
            default:
              return false;
          }
        })
      )
      .map((c) => c.id);
  },
}));
