import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { HWShell } from '../../components/arcade';

export function OperatorStub(props: SkinProps) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <HWShell {...props} />
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(74,222,128,.1)', border: '1px solid #4ade80',
        padding: '4px 14px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '.3em', color: '#4ade80', textTransform: 'uppercase',
        pointerEvents: 'none', zIndex: 9999,
      }}>
        OPERATOR · EN DESARROLLO
      </div>
    </div>
  );
}
