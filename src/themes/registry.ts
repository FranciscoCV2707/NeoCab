import type { SkinId } from '../stores/useThemeStore';

export interface ThemeEntry {
  id: string;
  name: string;
  skin: SkinId;
  version: string;
  tagline: string;
  description: string;
  inspiration: string;
  accent: string;
  hw: { base_hue: number; base_hue2: number };
  effects: {
    scanlines: boolean;
    crt_curve: number;
    glow_intensity: number;
    vignette: number;
    noise: number;
    blur_unselected: number;
    shadow_enabled: boolean;
  };
  status: 'available' | 'planned';
}

export const THEME_REGISTRY: ThemeEntry[] = [
  {
    id: 'hyperwheel',
    name: 'HyperWheel',
    skin: 'hyperwheel',
    version: '1.0.0',
    tagline: 'Retro-futurista · CRT · OKLCH dynamics',
    description: 'Rueda vertical clásica con efectos CRT y paleta oklch dinámica.',
    inspiration: 'Future Pinball · LaunchBox BigBox',
    accent: '#ffb000',
    hw: { base_hue: 35, base_hue2: 195 },
    effects: { scanlines: false, crt_curve: 0.2, glow_intensity: 0.6, vignette: 0.3, noise: 0.04, blur_unselected: 0, shadow_enabled: true },
    status: 'available',
  },
  {
    id: 'hyperrush',
    name: 'HyperRush',
    skin: 'hyperrush',
    version: '1.0.0',
    tagline: 'HyperSpin style · aggressive · full bleed',
    description: 'Preview CRT arriba, rueda curva, logo gigante. Inspirado en HyperSpin clásico.',
    inspiration: 'HyperSpin · Attract Mode',
    accent: '#ff2c8f',
    hw: { base_hue: 35, base_hue2: 320 },
    effects: { scanlines: true, crt_curve: 0.4, glow_intensity: 0.8, vignette: 0.4, noise: 0.06, blur_unselected: 0, shadow_enabled: true },
    status: 'available',
  },
  {
    id: 'neonwall',
    name: 'NeonWall',
    skin: 'neonwall',
    version: '1.0.0',
    tagline: 'Neon tiles · cyberpunk · grid layout',
    description: 'Muro de tiles neon con layout en rejilla. Acento cyan/magenta puro.',
    inspiration: 'Cyberpunk 2077 UI · retrowave',
    accent: '#22d8ff',
    hw: { base_hue: 200, base_hue2: 320 },
    effects: { scanlines: false, crt_curve: 0, glow_intensity: 0.9, vignette: 0.2, noise: 0.02, blur_unselected: 0, shadow_enabled: true },
    status: 'available',
  },
  {
    id: 'batocera',
    name: 'Batocera',
    skin: 'batocera',
    version: '0.8.0',
    tagline: 'Clean · warm · EmulationStation style',
    description: 'Inspirado en EmulationStation. Limpio, cálido y cómodo para navegar.',
    inspiration: 'EmulationStation · Batocera Linux',
    accent: '#D97757',
    hw: { base_hue: 25, base_hue2: 200 },
    effects: { scanlines: false, crt_curve: 0, glow_intensity: 0.3, vignette: 0.15, noise: 0, blur_unselected: 0, shadow_enabled: true },
    status: 'available',
  },
  {
    id: 'flux',
    name: 'Flux',
    skin: 'flux',
    version: '0.5.0',
    tagline: 'Diagonal panels · floating meta · attract',
    description: 'Paneles en perspectiva y fanart a pantalla completa. Diseñado para attract mode.',
    inspiration: 'Steam Big Picture · Kodi Estuary',
    accent: '#8b5cf6',
    hw: { base_hue: 290, base_hue2: 50 },
    effects: { scanlines: false, crt_curve: 0, glow_intensity: 0.5, vignette: 0.25, noise: 0.03, blur_unselected: 0, shadow_enabled: true },
    status: 'available',
  },
  {
    id: 'operator',
    name: 'Operator',
    skin: 'operator',
    version: '0.3.0',
    tagline: 'Dark ops · monochrome · terminal',
    description: 'Interfaz de operador. Monocromático, funcional, cero distracciones.',
    inspiration: 'Bloomberg Terminal · BIOS UIs',
    accent: '#4ade80',
    hw: { base_hue: 135, base_hue2: 195 },
    effects: { scanlines: true, crt_curve: 0.1, glow_intensity: 0.4, vignette: 0.5, noise: 0.08, blur_unselected: 0, shadow_enabled: false },
    status: 'available',
  },
];

export function getThemeEntry(id: string): ThemeEntry | undefined {
  return THEME_REGISTRY.find(t => t.id === id);
}
