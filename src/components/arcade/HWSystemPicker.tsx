import { useEffect, useRef } from 'react';
import { System } from '../../stores/types';
import { MediaShape, getSystemShape, getSystemHue } from './MediaShape';

interface HWSystemPickerProps {
  systems: System[];
  focusedIndex: number;
  onSelect: (system: System) => void;
  onBack: () => void;
}

export function HWSystemPicker({ systems, focusedIndex, onSelect, onBack }: HWSystemPickerProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const sys = systems[focusedIndex];

  useEffect(() => {
    const el = railRef.current?.querySelector('.hw-rail-item.active') as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [focusedIndex]);

  if (!sys) return null;

  // Show 7 slots: [-3, -2, -1, 0, +1, +2, +3] with wrapping
  const visible = [-3, -2, -1, 0, 1, 2, 3].map(d => {
    const i = ((focusedIndex + d) % systems.length + systems.length) % systems.length;
    return { sys: systems[i], i, d };
  });

  const [hue] = getSystemHue(sys.name);

  return (
    <div className="hw-sysp">
      {/* Head row */}
      <div className="hw-sysp-head">
        <div className="hw-sysp-eyebrow">
          <span className="sq" />
          <span>SELECT SYSTEM</span>
          <span className="dim">·</span>
          <span className="dim">{systems.length} LIBRARIES</span>
        </div>

        <div className="hw-sysp-title-wrap">
          <div className="hw-sysp-kind">■ PLATFORM</div>
          <div className="hw-sysp-name" style={{ '--hue': hue } as React.CSSProperties}>
            {sys.display_name.toUpperCase()}
          </div>
          <div className="hw-sysp-tag">{sys.name.toUpperCase()}</div>
        </div>

        <div className="hw-sysp-counter" style={{ '--hue': hue } as React.CSSProperties}>
          <div className="hw-sysp-counter-v">—</div>
          <div className="hw-sysp-counter-k">TITLES</div>
        </div>
      </div>

      {/* Carousel */}
      <div className="hw-sysp-carousel">
        <div className="hw-sysp-track">
          {visible.map(({ sys: s, i, d }) => {
            const abs = Math.abs(d);
            const [cardHue, cardHue2] = getSystemHue(s.name);
            const shape = getSystemShape(s.name);
            const tx    = d * 320;
            const scale = d === 0 ? 1 : abs === 1 ? 0.78 : abs === 2 ? 0.6 : 0.46;
            const rotY  = d * -16;
            const opacity = abs === 0 ? 1 : abs === 1 ? .88 : abs === 2 ? .55 : .25;
            const blur    = abs === 0 ? 0 : abs === 1 ? .3 : abs === 2 ? 1.2 : 2.4;

            return (
              <button
                key={`${i}-${d}`}
                className={`hw-sys-card depth-${abs}${d === 0 ? ' active' : ''}`}
                style={{
                  transform: `translateX(${tx}px) scale(${scale}) rotateY(${rotY}deg)`,
                  opacity,
                  filter: blur > 0 ? `blur(${blur}px)` : undefined,
                  zIndex: 100 - abs,
                  '--hue':  cardHue,
                  '--hue2': cardHue2,
                } as React.CSSProperties}
                onClick={() => onSelect(s)}
                tabIndex={-1}
              >
                <div className="hw-sys-card-bg" />
                <div className="hw-sys-card-grid" />
                <div className="hw-sys-card-kind">■ PLATFORM</div>
                <div className="hw-sys-card-media">
                  <MediaShape shape={shape} hue={cardHue} short={s.name.slice(0,4).toUpperCase()} />
                </div>
                <div className="hw-sys-card-body">
                  <div className="hw-sys-card-name">{s.display_name}</div>
                  <div className="hw-sys-card-tag">{s.name.toUpperCase()}</div>
                  <div className="hw-sys-card-foot">
                    <span className="hw-sys-card-count">—</span>
                    <span className="hw-sys-card-count-k">TITLES</span>
                  </div>
                </div>
                {d === 0 && (
                  <>
                    <div className="hw-card-corners">
                      <span className="cc tl" /><span className="cc tr" />
                      <span className="cc bl" /><span className="cc br" />
                    </div>
                    <div className="hw-card-rays" />
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className="hw-sysp-pointer" />
      </div>

      {/* Bottom rail */}
      <div className="hw-sysp-rail-wrap">
        <div className="hw-sysp-rail" ref={railRef}>
          {systems.map((s, i) => {
            const [h] = getSystemHue(s.name);
            return (
              <div
                key={s.id}
                className={`hw-rail-item${i === focusedIndex ? ' active' : ''}`}
                style={{ '--hue': h } as React.CSSProperties}
                onClick={() => onSelect(s)}
              >
                <span className="ri-short">{s.name.slice(0,4).toUpperCase()}</span>
                <span className="ri-name">{s.display_name}</span>
              </div>
            );
          })}
        </div>
        <div className="hw-sysp-rail-fade left" />
        <div className="hw-sysp-rail-fade right" />
      </div>

      <button
        onClick={onBack}
        style={{
          all: 'unset', cursor: 'pointer', position: 'absolute', top: 20, left: 56,
          fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '.3em',
          color: 'var(--bone-dim)', textTransform: 'uppercase', opacity: .6,
        }}
      >
        ← VOLVER
      </button>
    </div>
  );
}
