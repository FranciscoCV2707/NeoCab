import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Theme {
  name: string;
  version: string;
  author: string;
  description: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  layout: {
    system_view: string;
    game_view: string;
    wheel_style: string;
    transition: string;
    animation_speed: number;
    easing: string;
  };
  effects: {
    scanlines: boolean;
    crt_curve: number;
    glow_intensity: number;
    shadow_enabled: boolean;
  };
}

interface ThemeStore {
  currentTheme: Theme | null;
  themes: Theme[];
  loading: boolean;
  listThemes: () => Promise<void>;
  applyTheme: (theme: Theme) => void;
  reloadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: null,
  themes: [],
  loading: false,

  listThemes: async () => {
    try {
      const themes = await invoke<Theme[]>("list_themes");
      set({ themes });
    } catch (e) {
      console.error("Failed to list themes:", e);
    }
  },

  applyTheme: (theme: Theme) => {
    set({ currentTheme: theme });
    localStorage.setItem("neocab_theme", JSON.stringify(theme));
  },

  reloadTheme: async () => {
    // Clear cached theme CSS
    document.querySelectorAll('[data-theme-css]').forEach(el => el.remove());
    document.getElementById("scanlines-overlay")?.remove();

    // Remove theme body class
    const body = document.body;
    body.className = body.className.split(" ").filter(c => !c.startsWith("theme-")).join(" ");

    // Re-apply current theme from localStorage or fetch from backend
    const cached = localStorage.getItem("neocab_theme");
    if (cached) {
      try {
        const theme = JSON.parse(cached) as Theme;
        get().applyTheme(theme);
      } catch {
        // Fall back to listing themes
        await get().listThemes();
        if (get().themes.length > 0) {
          get().applyTheme(get().themes[0]);
        }
      }
    }

    // Trigger re-render by toggling a CSS animation class
    document.documentElement.style.setProperty("--theme-reload", Date.now().toString());
  },
}));

// Initialize F5 hotkey for theme reload
export function initThemeHotkey() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "F5") {
      e.preventDefault();
      useThemeStore.getState().reloadTheme();
    }
  });
}
