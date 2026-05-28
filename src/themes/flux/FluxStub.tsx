import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { HWShell } from '../../components/arcade';

export function FluxStub(props: SkinProps) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <HWShell {...props} />
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(139,92,246,.15)', border: '1px solid #8b5cf6',
        padding: '4px 14px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '.3em', color: '#8b5cf6', textTransform: 'uppercase',
        pointerEvents: 'none', zIndex: 9999,
      }}>
        FLUX · EN DESARROLLO
      </div>
    </div>
  );
}
