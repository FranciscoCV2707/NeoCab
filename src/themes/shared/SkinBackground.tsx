// Standalone, ambient-only background of each skin, extracted so it can be
// mounted behind framed panels (Operator/Settings) and, later, composed at the
// widget level. Renders ONLY the backdrop layers — no shell, no carousel.
// Each skin's CSS is imported here so its classes resolve regardless of which
// skin is currently mounted.
import '../hyperrush/hyperrush.css';
import '../neonwall/neonwall.css';
import '../flux/flux.css';
import '../batocera/batocera.css';
import '../operator/operator.css';

export function SkinBackground({ skin }: { skin?: string }) {
  switch (skin) {
    case 'hyperrush':
    case 'hyperwheel':
      return (
        <div className={`theme-hyperrush${skin === 'hyperwheel' ? ' hr-variant-wheel' : ''}`} style={{ position: 'absolute', inset: 0 }}>
          <div className="hr-bg">
            <div className="hr-bg-rays" />
            <div className="hr-bg-grid" />
          </div>
          <div className="hr-scan" />
          <div className="hr-vignette" />
          <div className="hr-noise" />
        </div>
      );
    case 'neonwall':
      return (
        <div className="theme-neonwall" style={{ position: 'absolute', inset: 0 }}>
          <div className="nw-bg">
            <div className="nw-bg-rays" />
            <div className="nw-bg-tex" />
          </div>
        </div>
      );
    case 'flux':
      return (
        <div className="theme-flux" style={{ position: 'absolute', inset: 0 }}>
          <div className="fx-bg"><div className="fx-bg-tex" /></div>
        </div>
      );
    case 'batocera':
      return (
        <div className="theme-batocera" style={{ position: 'absolute', inset: 0 }}>
          <div className="bat-bg">
            <div className="bat-bg-art" />
            <div className="bat-bg-tex" />
            <div className="bat-bg-glow" />
          </div>
        </div>
      );
    case 'operator':
      return (
        <div className="theme-operator" style={{ position: 'absolute', inset: 0 }}>
          <div className="op-glow-layer" />
        </div>
      );
    default:
      return null;
  }
}
