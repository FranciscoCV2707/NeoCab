import type { SkinProps } from './hyperrush/HyperRushSkin';
import { HyperRushSkin } from './hyperrush/HyperRushSkin';
import { NeonWallSkin } from './neonwall/NeonWallSkin';
import { FluxSkin } from './flux/FluxSkin';
import { BatoceraSkin } from './batocera/BatoceraSkin';
import { OperatorSkin } from './operator/OperatorSkin';
import type { ComposeMap, SkinId } from '../stores/useThemeStore';

export const DEFAULT_COMPOSE: ComposeMap = { home: 'hyperrush', systems: 'neonwall', games: 'operator' };

// Renders one of the real skins depending on the current screen, so a single
// "composed" theme can mix Home from one theme, Systems from another, etc.
// Each skin already renders only the screen matching `currentView`, so we just
// mount the chosen skin with the same props.
export function ComposedSkin({ compose, ...props }: SkinProps & { compose: ComposeMap }) {
  const key: keyof ComposeMap =
    props.currentView === 'menu' ? 'home' :
    props.currentView === 'systems' ? 'systems' : 'games';
  const skinId: SkinId = compose[key] ?? 'hyperrush';

  switch (skinId) {
    case 'hyperwheel': return <HyperRushSkin {...props} variant="wheel" />;
    case 'neonwall':   return <NeonWallSkin {...props} />;
    case 'flux':       return <FluxSkin {...props} />;
    case 'batocera':   return <BatoceraSkin {...props} />;
    case 'operator':   return <OperatorSkin {...props} />;
    case 'hyperrush':
    default:           return <HyperRushSkin {...props} />;
  }
}
