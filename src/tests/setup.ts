/// <reference types="vitest" />
import "@testing-library/jest-dom";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `tauri://localhost/${path}`),
}));

// Mock Tauri events
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
  emit: vi.fn(),
}));

// Mock localStorage
const store: Record<string, string> = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  },
  writable: true,
});
