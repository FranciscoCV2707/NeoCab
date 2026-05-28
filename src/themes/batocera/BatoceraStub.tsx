import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { HWShell } from '../../components/arcade';

// Batocera skin uses HyperWheel shell with warm orange hue overrides until full port
export function BatoceraStub(props: SkinProps) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <HWShell {...props} />
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(217,119,87,.15)', border: '1px solid #D97757',
        padding: '4px 14px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '.3em', color: '#D97757', textTransform: 'uppercase',
        pointerEvents: 'none', zIndex: 9999,
      }}>
        BATOCERA · EN DESARROLLO
      </div>
    </div>
  );
}
