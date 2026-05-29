// shared/menu.ts — Arcade menu data used by all skins

export interface MenuItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

export interface SettingsItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

// Real NeoCab system menu (matches the original MainMenu): Jugar, Escanear,
// Configuración, Operador. Every theme renders THIS, not the DEMO's favs/recent/shuffle.
export const ARCADE_MENU: MenuItem[] = [
  { id: 'play',     label: 'Jugar',         sub: 'elegir sistema',               icon: '▶' },
  { id: 'scan',     label: 'Escanear',      sub: 'buscar e indexar roms',        icon: '⟳' },
  { id: 'settings', label: 'Configuración', sub: 'temas · controles · opciones', icon: '⚙' },
  { id: 'operator', label: 'Operador',      sub: 'créditos · timer · stats',     icon: '◉' },
];

// ids map 1:1 to the real SettingsPanel tabs (plus 'operator' / 'back'), so a
// skin can route an entry directly via onShowSettings(id) / onShowOperator().
export const SETTINGS_MENU: SettingsItem[] = [
  { id: 'theme',     label: 'Themes',    sub: 'look · colors · layout',  icon: '◈' },
  { id: 'systems',   label: 'Systems',   sub: 'rom paths · platforms',   icon: '▤' },
  { id: 'controls',  label: 'Controls',  sub: 'buttons · joystick',      icon: '⌘' },
  { id: 'keymap',    label: 'Keyboard',  sub: 'navigation keys',         icon: '⌨' },
  { id: 'scraper',   label: 'Scraper',   sub: 'fetch artwork',           icon: '⌕' },
  { id: 'emulators', label: 'Emulators', sub: 'cores · standalone',      icon: '▣' },
  { id: 'operator',  label: 'Operator',  sub: 'coins · timer · stats',   icon: '◉' },
  { id: 'back',      label: 'Back',      sub: 'return home',             icon: '←' },
];

// resolveMenuShortcut maps menu id to filtered games
export function resolveMenuShortcut<T extends { favorite?: number; lastPlayed?: string }>(
  id: string,
  allGames: T[]
): { kind: string; games: T[]; label: string } | null {
  if (id === 'favs')
    return { kind: 'favs',   games: allGames.filter(g => g.favorite === 1),                          label: 'Favorites' };
  if (id === 'recent')
    return { kind: 'recent', games: allGames.filter(g => g.lastPlayed && g.lastPlayed !== 'Never'), label: 'Recent' };
  if (id === 'shuffle')
    return { kind: 'shuffle', games: [...allGames].sort(() => Math.random() - 0.5),                  label: 'Shuffle' };
  return null;
}