import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { injectThemeAssets, unloadThemeAssets } from "../themes/engine/themePlugin";
import type { ThemeScreens } from "../types/layout";

export type SkinId = 'hyperwheel' | 'hyperrush' | 'neonwall' | 'batocera' | 'flux' | 'operator' | 'classic' | 'composed';

// A composed theme renders a different skin per screen (Home / Systems / Games).
export interface ComposeMap {
  home: SkinId;
  systems: SkinId;
  games: SkinId;
}

// ── Widget-level composition (HyperTheme-style) ───────────────────────────
// On top of the per-screen base skin, the visual editor can place individual
// pieces (background, marquee, wheel, crt, clock, stats, text), each sourced
// from any skin and freely positioned. Coordinates are percentages (0-100).
export type ScreenKey = 'home' | 'systems' | 'games';
// Every piece is a faithful slice of a real skin (rendered with that skin's own
// markup + CSS), so picking a skin source reproduces its exact look.
export type WidgetType = 'background' | 'marquee' | 'menu' | 'card' | 'gamewheel' | 'showcase' | 'clock';
export type WidgetFit = 'scale' | 'crop' | 'stretch';
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  /** Which skin's version of this piece to render. */
  skin: SkinId;
  x: number; y: number; w: number; h: number;
  z: number;
  /** Overrides the piece's default fit: scale (whole), crop (clip), stretch (fill). */
  fit?: WidgetFit;
}
export type WidgetLayout = Partial<Record<ScreenKey, WidgetInstance[]>>;

export interface ThemeBackground {
  type: "color" | "gradient" | "image" | "video";
  color: string;
  gradient: string | null;
  image: string | null;
  video: string | null;
  opacity: number;
  blur: number;
  overlay_color: string | null;
}

export interface ThemeWheel {
  item_size: number;
  item_spacing: number;
  animation_duration: number;
  selected_color: string;
  unselected_color: string;
  selected_scale: number;
  glow_selected: boolean;
}

export interface ThemeOverlay {
  coin_position: string;
  timer_position: string;
  stats_opacity: number;
  animation_style: string;
}

export interface Theme {
  name: string;
  version: string;
  author: string;
  style?: string;
  skin?: SkinId;
  /** For skin === 'composed': which skin renders each screen. */
  compose?: ComposeMap;
  /** Optional per-screen widget overlay (HyperTheme-style placement). */
  widgets?: WidgetLayout;
  hw?: { base_hue: number; base_hue2: number };
  description: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  background?: ThemeBackground;
  layout: {
    system_view: string;
    game_view: string;
    wheel_style: string;
    transition: string;
    animation_speed: number;
    easing: string;
  };
  wheel?: ThemeWheel;
  effects: {
    scanlines: boolean;
    crt_curve: number;
    glow_intensity: number;
    shadow_enabled: boolean;
    vignette?: number;
    noise?: number;
    blur_unselected?: number;
  };
  overlay?: ThemeOverlay;
  media?: Record<string, unknown>;
  sounds?: Record<string, string>;
  screens?: ThemeScreens;
}

interface ThemeStore {
  currentTheme: Theme | null;
  themes: Theme[];
  loading: boolean;
  listThemes: () => Promise<void>;
  applyTheme: (theme: Theme) => void;
  currentThemeId: string | null;
  setCurrentThemeId: (id: string) => void;
  reloadTheme: () => Promise<void>;
}

export function injectThemeCss(theme: Theme) {
  const root = document.documentElement;

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Canonical theme tokens — every skin reads these (with its own fallback),
  // so editing colors/hue in the ThemeEditor recolors all 5 skins live.
  const c = theme.colors;
  const setIf = (name: string, value: string | undefined) => {
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  };
  setIf("--theme-accent", c.accent);
  setIf("--theme-accent-hot", c.highlight ?? c.accent);
  setIf("--theme-text", c.text);
  setIf("--theme-bone", c.text);
  setIf("--theme-bg", c.background);
  setIf("--theme-deep", c.background);
  setIf("--theme-surface", c.surface);
  setIf("--theme-border", c.border);
  if (theme.hw) {
    root.style.setProperty("--theme-h", String(theme.hw.base_hue));
    root.style.setProperty("--theme-h2", String(theme.hw.base_hue2));
  } else {
    root.style.removeProperty("--theme-h");
    root.style.removeProperty("--theme-h2");
  }

  // Fonts
  root.style.setProperty("--font-ui", theme.fonts.ui || "Arial");
  root.style.setProperty("--font-title", theme.fonts.title || "Impact");
  root.style.setProperty("--font-subtitle", theme.fonts.subtitle || "Arial");
  root.style.setProperty("--font-mono", theme.fonts.mono || "Consolas");

  // Google Font import
  const googleFont = theme.fonts.google_font;
  if (googleFont) {
    const linkId = "theme-google-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFont)}&display=swap`;
    root.style.setProperty("--font-google", googleFont);
  }

  // Layout
  root.style.setProperty("--animation-speed", `${theme.layout.animation_speed}ms`);
  root.style.setProperty("--transition-type", theme.layout.transition);
  root.style.setProperty("--easing", theme.layout.easing);
  root.dataset.systemView = theme.layout.system_view;
  root.dataset.gameView = theme.layout.game_view;
  root.dataset.wheelStyle = theme.layout.wheel_style;

  // Effects
  root.style.setProperty("--glow-intensity", String(theme.effects.glow_intensity));
  root.style.setProperty("--crt-curve", String(theme.effects.crt_curve));
  root.style.setProperty("--vignette", String(theme.effects.vignette ?? 0));
  root.style.setProperty("--noise-opacity", String(theme.effects.noise ?? 0));
  root.style.setProperty("--blur-unselected", `${theme.effects.blur_unselected ?? 0}px`);
  root.style.setProperty("--shadow-enabled", theme.effects.shadow_enabled ? "1" : "0");

  // Background
  const bg = theme.background;
  if (bg) {
    root.style.setProperty("--bg-type", bg.type);
    root.style.setProperty("--bg-color", bg.color);
    root.style.setProperty("--bg-gradient", bg.gradient || "none");
    root.style.setProperty("--bg-image", bg.image ? `url('${bg.image}')` : "none");
    root.style.setProperty("--bg-opacity", String(bg.opacity));
    root.style.setProperty("--bg-blur", `${bg.blur}px`);
    root.style.setProperty("--bg-overlay", bg.overlay_color || "transparent");
  }

  // Wheel
  const wheel = theme.wheel;
  if (wheel) {
    root.style.setProperty("--wheel-item-size", `${wheel.item_size}px`);
    root.style.setProperty("--wheel-spacing", `${wheel.item_spacing}px`);
    root.style.setProperty("--wheel-selected-color", wheel.selected_color);
    root.style.setProperty("--wheel-unselected-color", wheel.unselected_color);
    root.style.setProperty("--wheel-selected-scale", String(wheel.selected_scale));
    root.style.setProperty("--wheel-anim-duration", `${wheel.animation_duration}ms`);
  }

  // Scanlines overlay
  const existing = document.getElementById("scanlines-overlay");
  if (theme.effects.scanlines) {
    if (!existing) {
      const el = document.createElement("div");
      el.id = "scanlines-overlay";
      el.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:9999;" +
        "background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)";
      document.body.appendChild(el);
    }
  } else {
    existing?.remove();
  }

  // Body/root data attributes
  document.body.dataset.theme = theme.name.toLowerCase().replace(/\s+/g, "-");
  if (theme.style) root.dataset.themeStyle = theme.style;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: null,
  currentThemeId: null,
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
    injectThemeCss(theme);
    // Load theme.css + theme.js from disk (non-blocking, optional)
    const slug = theme.name.toLowerCase().replace(/\s+/g, "-");
    invoke<string>("get_theme_path", { themeName: slug })
      .then((path) => injectThemeAssets(slug, path))
      .catch((e) => console.warn("[ThemeSDK] Could not load theme assets:", e));
  },

  setCurrentThemeId: (id: string) => {
    set({ currentThemeId: id });
    localStorage.setItem("neocab_theme_id", id);
  },

  reloadTheme: async () => {
    document.getElementById("scanlines-overlay")?.remove();
    await unloadThemeAssets();

    const cached = localStorage.getItem("neocab_theme");
    if (cached) {
      try {
        const theme = JSON.parse(cached) as Theme;
        get().applyTheme(theme);
      } catch {
        await get().listThemes();
        if (get().themes.length > 0) {
          get().applyTheme(get().themes[0]);
        }
      }
    }

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
