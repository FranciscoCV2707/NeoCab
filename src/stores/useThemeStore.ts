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

// ─── Platform-specific accent colors ──────────────────────────────────────────
// Each entry maps a system name to CSS variable overrides applied while
// navigating that system. This augments (not replaces) the active theme.

export interface PlatformAccent {
  /** Primary accent color (hex). */
  primary: string;
  /** Secondary/background accent (hex). */
  secondary: string;
  /** Neutral text color (hex). */
  text: string;
}

const PLATFORM_ACCENTS: Record<string, PlatformAccent> = {
  // Nintendo
  nes:         { primary: "#e4000f", secondary: "#2d2d2d", text: "#ffffff" },
  famicom:     { primary: "#c8102e", secondary: "#1a1a1a", text: "#ffffff" },
  snes:        { primary: "#7b5ea7", secondary: "#211438", text: "#f0e6ff" },
  super_famicom:{ primary: "#7b5ea7", secondary: "#211438", text: "#f0e6ff" },
  n64:         { primary: "#009ac7", secondary: "#1a3a4a", text: "#ffffff" },
  gamecube:    { primary: "#6a0dad", secondary: "#1e0030", text: "#d9b3ff" },
  wii:         { primary: "#c0c0c0", secondary: "#e8e8e8", text: "#1a1a1a" },
  gb:          { primary: "#7c9e3c", secondary: "#1e2a0a", text: "#c8e060" },
  gbc:         { primary: "#b22222", secondary: "#2a0a0a", text: "#ff9999" },
  gba:         { primary: "#5b2c8a", secondary: "#1a0a2a", text: "#c99fe0" },
  nds:         { primary: "#e87722", secondary: "#3a1a00", text: "#ffd080" },
  // Sega
  genesis:     { primary: "#1a6ebd", secondary: "#0a1e38", text: "#70c0ff" },
  megadrive:   { primary: "#1a6ebd", secondary: "#0a1e38", text: "#70c0ff" },
  mastersystem:{ primary: "#cc0000", secondary: "#2a0000", text: "#ff8080" },
  saturn:      { primary: "#808080", secondary: "#1a1a1a", text: "#d0d0d0" },
  dreamcast:   { primary: "#e86000", secondary: "#2a1400", text: "#ffa040" },
  // Sony
  psx:         { primary: "#003087", secondary: "#000d24", text: "#5588cc" },
  ps2:         { primary: "#003087", secondary: "#000820", text: "#7799dd" },
  psp:         { primary: "#00439c", secondary: "#001030", text: "#88aaff" },
  // Arcade
  mame:        { primary: "#ff6600", secondary: "#1a0a00", text: "#ffaa44" },
  arcade:      { primary: "#ff6600", secondary: "#1a0a00", text: "#ffaa44" },
  fbneo:       { primary: "#ff4400", secondary: "#1a0500", text: "#ff9966" },
  neogeo:      { primary: "#ffd700", secondary: "#1a1400", text: "#ffe680" },
  // Atari
  atari2600:   { primary: "#cc7700", secondary: "#1a0f00", text: "#ffcc44" },
  // PC / Other
  scummvm:     { primary: "#669900", secondary: "#0a1400", text: "#aadd44" },
  amiga:       { primary: "#cc4400", secondary: "#1a0800", text: "#ff8844" },
};

/** Get platform-specific accent colors for a given system name. */
export function getPlatformAccent(systemName: string): PlatformAccent | null {
  return PLATFORM_ACCENTS[systemName.toLowerCase()] ?? null;
}

/** Apply platform accent CSS variables to `:root`. Call when entering a system. */
export function applyPlatformAccent(systemName: string) {
  const accent = getPlatformAccent(systemName);
  const root = document.documentElement;
  if (accent) {
    root.style.setProperty("--platform-primary", accent.primary);
    root.style.setProperty("--platform-secondary", accent.secondary);
    root.style.setProperty("--platform-text", accent.text);
    root.dataset.platformTheme = systemName.toLowerCase();
  } else {
    root.style.removeProperty("--platform-primary");
    root.style.removeProperty("--platform-secondary");
    root.style.removeProperty("--platform-text");
    delete root.dataset.platformTheme;
  }
}
