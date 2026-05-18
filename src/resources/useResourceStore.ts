import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  Resource,
  ResourceType,
  ResourceLoadOptions,
  ResourcePool,
  DEFAULT_POOL_CONFIG,
} from './types';

interface ResourceState {
  pool: ResourcePool;
  loadingResources: Set<string>;
  preloadQueue: string[];
}

interface ResourceActions {
  load: <T>(id: string, type: ResourceType, path: string, options?: ResourceLoadOptions) => Promise<T | null>;
  unload: (id: string) => Promise<boolean>;
  preload: (ids: string[]) => Promise<void>;
  get: <T>(id: string) => T | null;
  has: (id: string) => boolean;
  clear: () => void;
  clearType: (type: ResourceType) => void;
  getStats: () => { count: number; size: number; byType: Record<ResourceType, number> };
}

const initialPool: ResourcePool = {
  resources: new Map(),
  maxSize: 500 * 1024 * 1024,
  currentSize: 0,
  evictionPolicy: 'lru',
};

export const useResourceStore = create<ResourceState & ResourceActions>((set, get) => ({
  pool: initialPool,
  loadingResources: new Set(),
  preloadQueue: [],

  load: async <T>(id: string, type: ResourceType, path: string, options: ResourceLoadOptions = {}) => {
    const { pool, loadingResources } = get();

    if (pool.resources.has(id)) {
      const resource = pool.resources.get(id)!;
      if (resource.isLoaded) {
        resource.lastAccessed = Date.now();
        return resource.data as T;
      }
    }

    if (loadingResources.has(id)) {
      return null;
    }

    set((state) => {
      state.loadingResources.add(id);
      const newResources = new Map(state.pool.resources);
      newResources.set(id, {
        id,
        type,
        name: path.split('/').pop() || id,
        path,
        data: null,
        size: 0,
        loadedAt: 0,
        lastAccessed: Date.now(),
        lastModified: Date.now(),
        refCount: 0,
        isLoaded: false,
        isLoading: true,
        error: null,
      });
      return {
        pool: { ...state.pool, resources: newResources },
        loadingResources: new Set(state.loadingResources),
      };
    });

    try {
      const result = await invoke<string>('load_resource', { id, type, path });
      const data = JSON.parse(result);

      set((state) => {
        const resource = state.pool.resources.get(id);
        if (!resource) return state;

        const newResources = new Map(state.pool.resources);
        newResources.set(id, {
          ...resource,
          data: data as T,
          isLoaded: true,
          isLoading: false,
          loadedAt: Date.now(),
        });

        return {
          pool: { ...state.pool, resources: newResources },
          loadingResources: new Set(
            Array.from(state.loadingResources).filter((rid) => rid !== id)
          ),
        };
      });

      return data as T;
    } catch (error) {
      set((state) => {
        const resource = state.pool.resources.get(id);
        if (!resource) return state;

        const newResources = new Map(state.pool.resources);
        newResources.set(id, {
          ...resource,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          pool: { ...state.pool, resources: newResources },
          loadingResources: new Set(
            Array.from(state.loadingResources).filter((rid) => rid !== id)
          ),
        };
      });

      return null;
    }
  },

  unload: async (id) => {
    const { pool } = get();
    const resource = pool.resources.get(id);

    if (!resource) return false;

    if (resource.refCount > 0) {
      return false;
    }

    try {
      await invoke('unload_resource', { id });
    } catch {
      // Ignore errors on unload
    }

    set((state) => {
      const newResources = new Map(state.pool.resources);
      newResources.delete(id);
      return {
        pool: { ...state.pool, resources: newResources },
      };
    });

    return true;
  },

  preload: async (ids) => {
    const { load } = get();
    const promises = ids.map((id) => {
      const resource = get().pool.resources.get(id);
      if (!resource) return Promise.resolve();
      return load(resource.id, resource.type, resource.path);
    });
    await Promise.all(promises);
  },

  get: <T>(id: string) => {
    const resource = get().pool.resources.get(id);
    if (!resource || !resource.isLoaded) return null;
    resource.lastAccessed = Date.now();
    return resource.data as T;
  },

  has: (id: string) => {
    const resource = get().pool.resources.get(id);
    return resource?.isLoaded ?? false;
  },

  clear: () => {
    set({
      pool: { ...initialPool, resources: new Map() },
    });
  },

  clearType: (type) => {
    set((state) => {
      const newResources = new Map(state.pool.resources);
      for (const [id, resource] of newResources) {
        if (resource.type === type && resource.refCount === 0) {
          newResources.delete(id);
        }
      }
      return {
        pool: { ...state.pool, resources: newResources },
      };
    });
  },

  getStats: () => {
    const { pool } = get();
    const stats = {
      count: pool.resources.size,
      size: pool.currentSize,
      byType: {
        image: 0,
        font: 0,
        audio: 0,
        video: 0,
        shader: 0,
        texture: 0,
      } as Record<ResourceType, number>,
    };

    for (const resource of pool.resources.values()) {
      if (resource.isLoaded) {
        stats.byType[resource.type]++;
      }
    }

    return stats;
  },
}));