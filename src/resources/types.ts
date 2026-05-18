export type ResourceType = 'image' | 'font' | 'audio' | 'video' | 'shader' | 'texture';

export interface Resource<T = unknown> {
  id: string;
  type: ResourceType;
  name: string;
  path: string;
  data: T | null;
  size: number;
  loadedAt: number;
  lastAccessed: number;
  lastModified: number;
  refCount: number;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ResourceLoadOptions {
  cache?: boolean;
  preload?: boolean;
  priority?: 'low' | 'normal' | 'high';
  onProgress?: (loaded: number, total: number) => void;
}

export interface ResourcePool {
  resources: Map<string, Resource>;
  maxSize: number;
  currentSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

export interface FontResource {
  family: string;
  weight: number;
  style: string;
  data: ArrayBuffer;
}

export interface TextureResource {
  width: number;
  height: number;
  format: string;
  data: ImageData | ArrayBuffer;
  mipmaps?: boolean;
}

export interface AudioResource {
  duration: number;
  sampleRate: number;
  channels: number;
  data: AudioBuffer;
}

export interface ImageResource {
  width: number;
  height: number;
  path: string;
  data: HTMLImageElement | ImageData;
}

export const DEFAULT_POOL_CONFIG = {
  maxSize: 500 * 1024 * 1024, // 500MB
  evictionPolicy: 'lru' as const,
  preloadDelay: 100,
  unloadDelay: 5000,
};

export function createResourceId(type: ResourceType, path: string): string {
  return `${type}:${path}`;
}

export function estimateResourceSize(resource: Resource): number {
  if (resource.size > 0) return resource.size;

  switch (resource.type) {
    case 'image':
      return 1024 * 1024; // 1MB estimate
    case 'font':
      return 50 * 1024; // 50KB estimate
    case 'audio':
      return 5 * 1024 * 1024; // 5MB estimate
    case 'video':
      return 50 * 1024 * 1024; // 50MB estimate
    case 'texture':
      return 4 * 1024 * 1024; // 4MB estimate
    default:
      return 1024; // 1KB default
  }
}