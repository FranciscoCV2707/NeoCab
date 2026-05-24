import { useUIStore } from '../stores/useUIStore';
import { useSystemStore } from '../stores/useSystemStore';
import type { NeoCabAPI } from '../types/theme-plugin';

const THEME_VAR_PREFIX = '--theme-';
const NEOCAB_VERSION = '2.0.0';

function getFocusedIndex(): number {
  // focusedIndex lives in useGameStore — access via DOM data attr as fallback
  // Reads from document attribute set by the wheel to avoid circular store deps
  const attr = document.documentElement.dataset.focusedIndex;
  return attr !== undefined ? parseInt(attr, 10) : 0;
}

export function buildNeoCabAPI(): NeoCabAPI {
  return {
    version: NEOCAB_VERSION,
    getCurrentView: () => useUIStore.getState().currentView,
    getFocusedIndex,
    getCurrentSystem: () => (useSystemStore.getState().selectedSystem as object | null) ?? null,
    getSystemCards: () => document.querySelectorAll('.system-card'),
    getCssVar: (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    setCssVar: (name: string, value: string) => {
      if (!name.startsWith(THEME_VAR_PREFIX)) {
        console.warn(`[NeoCabAPI] setCssVar: only ${THEME_VAR_PREFIX}* vars allowed, got "${name}"`);
        return;
      }
      document.documentElement.style.setProperty(name, value);
    },
  };
}

export function exposeNeoCabAPI(): void {
  window.NeoCabAPI = buildNeoCabAPI();
}
