import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Game, System } from '../../stores/types';
import type { SkinId, ComposeMap } from '../../stores/useThemeStore';
import type { SkinProps } from '../../themes/hyperrush/HyperRushSkin';
import { HyperRushSkin } from '../../themes/hyperrush/HyperRushSkin';
import { NeonWallSkin } from '../../themes/neonwall/NeonWallSkin';
import { FluxSkin } from '../../themes/flux/FluxSkin';
import { BatoceraSkin } from '../../themes/batocera/BatoceraSkin';
import { OperatorSkin } from '../../themes/operator/OperatorSkin';

// Live preview of the REAL theme skins, rendered at 1920x1080 and scaled down.
// It renders inside the Settings screen, where the live skin is NOT mounted,
// so the skins' internal `document.querySelector('.theme-*')` lookups resolve
// to this preview instance (no conflict with the running app).

const MOCK_SYSTEMS = [
  { id: 1, name: 'mame',    display_name: 'Arcade',  game_count: 412 },
  { id: 2, name: 'snes',    display_name: 'Super Nintendo', game_count: 689 },
  { id: 3, name: 'genesis', display_name: 'Mega Drive', game_count: 521 },
  { id: 4, name: 'psx',     display_name: 'PlayStation', game_count: 1204 },
  { id: 5, name: 'n64',     display_name: 'Nintendo 64', game_count: 296 },
  { id: 6, name: 'dreamcast', display_name: 'Dreamcast', game_count: 187 },
] as unknown as System[];

const MOCK_GAMES = [
  { id: 1, title: 'Metal Slug X', developer: 'SNK', year: 1999, genre: 'Run & Gun', players: 2, play_count: 142, is_favorite: 1 },
  { id: 2, title: 'Street Fighter II Turbo', developer: 'Capcom', year: 1992, genre: 'Versus Fighting', players: 2, play_count: 88, is_favorite: 1 },
  { id: 3, title: 'The King of Fighters 98', developer: 'SNK', year: 1998, genre: 'Versus Fighting', players: 2, play_count: 64, is_favorite: 0 },
  { id: 4, title: 'Final Fight', developer: 'Capcom', year: 1989, genre: "Beat 'em Up", players: 2, play_count: 51, is_favorite: 0 },
  { id: 5, title: 'Snow Bros', developer: 'Toaplan', year: 1990, genre: 'Platformer', players: 2, play_count: 33, is_favorite: 0 },
  { id: 6, title: 'Garou: Mark of the Wolves', developer: 'SNK', year: 1999, genre: 'Versus Fighting', players: 2, play_count: 77, is_favorite: 1 },
  { id: 7, title: 'Marvel vs Capcom', developer: 'Capcom', year: 1998, genre: 'Versus Fighting', players: 2, play_count: 95, is_favorite: 0 },
  { id: 8, title: 'Cadillacs and Dinosaurs', developer: 'Capcom', year: 1993, genre: "Beat 'em Up", players: 3, play_count: 40, is_favorite: 0 },
  { id: 9, title: 'Pac-Man', developer: 'Namco', year: 1980, genre: 'Maze', players: 1, play_count: 120, is_favorite: 1 },
  { id: 10, title: 'Donkey Kong', developer: 'Nintendo', year: 1981, genre: 'Platformer', players: 1, play_count: 60, is_favorite: 0 },
] as unknown as Game[];

const SKIN_COMPONENTS: Record<string, (p: SkinProps & { variant?: 'rush' | 'wheel' }) => JSX.Element> = {
  hyperwheel: HyperRushSkin,
  hyperrush: HyperRushSkin,
  neonwall: NeonWallSkin,
  flux: FluxSkin,
  batocera: BatoceraSkin,
  operator: OperatorSkin,
};

type PreviewView = 'menu' | 'systems' | 'games';

interface SkinPreviewProps {
  skin: SkinId;
  /** Canonical --theme-* CSS variables to scope onto the preview. */
  vars: CSSProperties;
  /** Rendered width in px; height follows 16:9. */
  width?: number;
  /** If set, render a different skin per screen (composed theme). */
  compose?: ComposeMap;
}

const noop = () => {};

export function SkinPreview({ skin, vars, width = 460, compose }: SkinPreviewProps) {
  const [view, setView] = useState<PreviewView>('systems');
  const scale = width / 1920;
  const height = 1080 * scale;

  const effectiveSkin: SkinId = compose
    ? (compose[view === 'menu' ? 'home' : view] ?? skin)
    : skin;
  const Comp = SKIN_COMPONENTS[effectiveSkin] ?? HyperRushSkin;

  const props: SkinProps & { variant?: 'rush' | 'wheel' } = useMemo(() => ({
    currentView: view,
    systems: MOCK_SYSTEMS,
    games: MOCK_GAMES,
    focusedIndex: view === 'games' ? 2 : 1,
    selectedSystem: MOCK_SYSTEMS[1],
    loading: false,
    scanProgress: '',
    onSelectSystem: noop,
    onPlayGame: noop,
    onBack: noop,
    onShowSystems: noop,
    onShowOperator: noop,
    onShowSettings: noop,
    onScanROMs: noop,
    variant: effectiveSkin === 'hyperwheel' ? 'wheel' : 'rush',
  }), [view, effectiveSkin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['menu', 'systems', 'games'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{
              flex: 1, padding: '4px 6px', fontSize: 10, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: 1, borderRadius: 4,
              border: '1px solid var(--theme-border, #444)',
              background: view === v ? 'var(--theme-accent, #ff6b35)' : 'transparent',
              color: view === v ? 'var(--theme-bg, #111)' : 'var(--theme-text, #ccc)',
            }}>
            {v === 'menu' ? 'Menú' : v === 'systems' ? 'Sistemas' : 'Juegos'}
          </button>
        ))}
      </div>
      <div style={{
        width, height, overflow: 'hidden', position: 'relative',
        borderRadius: 8, border: '1px solid var(--theme-border, #333)',
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 1920, height: 1080,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          pointerEvents: 'none',
          ...vars,
        }}>
          <Comp {...props} />
        </div>
      </div>
    </div>
  );
}
