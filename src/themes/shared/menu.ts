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

export const ARCADE_MENU: MenuItem[] = [
  { id: 'play',     label: 'Play',      sub: 'select a system',   icon: '▶' },
  { id: 'favs',     label: 'Favorites',sub: 'pinned titles',     icon: '★' },
  { id: 'recent',   label: 'Recent',   sub: 'continue session',  icon: '↻' },
  { id: 'shuffle',  label: 'Shuffle',  sub: 'surprise me',        icon: '?' },
  { id: 'settings', label: 'Settings', sub: 'themes & options',   icon: '⚙' },
];

export const SETTINGS_MENU: SettingsItem[] = [
  { id: 'themes',   label: 'Themes',    sub: 'change frontend look',   icon: '◈' },
  { id: 'video',    label: 'Video',     sub: 'scanlines · glow · crt', icon: '▢' },
  { id: 'audio',    label: 'Audio',     sub: 'attract sfx · music',    icon: '◐' },
  { id: 'controls', label: 'Controls',  sub: 'buttons · joystick',     icon: '⌘' },
  { id: 'cabinet',  label: 'Cabinet',   sub: 'resolution · 16:9 / 4:3',icon: '▣' },
  { id: 'scraper',  label: 'Scraper',   sub: 'fetch artwork',           icon: '⌕' },
  { id: 'back',     label: 'Back',      sub: 'return home',             icon: '←' },
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