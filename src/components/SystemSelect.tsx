import { useRef, useEffect, useState } from "react";
import { t } from '../i18n';
import { useThemeStore } from '../stores/useThemeStore';
import { ScreenRenderer } from './ScreenRenderer';
import './SystemSelect.css';

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

interface SystemSelectProps {
  systems: System[];
  onSelectSystem: (system: System) => void;
  onBack: () => void;
  loading: boolean;
  focusedIndex: number;
}

const systemColors: Record<string, string> = {
  'mame': '#ff6b00',
  'nes': '#e60012',
  'snes': '#6b3fa0',
  'genesis': '#0060c0',
  'psx': '#003087',
  'gb': '#8bac0f',
  'gba': '#4a68d8',
  'n64': '#008000',
  'arcade': '#ff006e',
  'default': '#888888',
};

export default function SystemSelect({
  systems,
  onSelectSystem,
  onBack,
  loading,
  focusedIndex,
}: SystemSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const systemView = currentTheme?.layout?.system_view ?? document.documentElement.dataset.systemView ?? 'carousel';

  if (currentTheme?.screens?.systems?.widgets?.length) {
    return (
      <ScreenRenderer
        layout={currentTheme.screens.systems}
        theme={currentTheme}
        systems={systems}
        focusedIndex={focusedIndex}
        onSelect={(idx) => onSelectSystem(systems[idx])}
      />
    );
  }

  useEffect(() => { setIsLoaded(true); }, []);

  useEffect(() => {
    if (systemView !== 'carousel') return;
    if (containerRef.current && systems.length > 0) {
      const focusedElement = containerRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        const containerWidth = containerRef.current.clientWidth;
        const elementOffset = focusedElement.offsetLeft;
        const elementWidth = focusedElement.clientWidth;
        containerRef.current.scrollTo({
          left: elementOffset - containerWidth / 2 + elementWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [focusedIndex, systems, systemView]);

  const currentSystem = systems[focusedIndex];
  const accentColor = systemColors[currentSystem?.name?.toLowerCase()] || systemColors.default;

  const header = (
    <div className={`system-header ${isLoaded ? 'loaded' : ''}`}>
      <button className="back-btn" onClick={onBack}>
        <span className="back-icon">←</span>
        <span>{t('BACK')}</span>
      </button>
      <div className="system-info">
        <h1 className="system-title">{currentSystem?.display_name || t('SELECT_SYSTEM')}</h1>
        <p className="system-subtitle">{t('CHOOSE_PLATFORM')}</p>
      </div>
      <div className="system-counter">
        <span className="counter-current">{focusedIndex + 1}</span>
        <span className="counter-separator">/</span>
        <span className="counter-total">{systems.length}</span>
      </div>
    </div>
  );

  // ── Grid layout ──────────────────────────────────────────
  if (systemView === 'grid') {
    return (
      <div className="system-select-container">
        <div className="system-ambient" style={{ '--system-color': accentColor } as React.CSSProperties} />
        {header}
        <div className="systems-grid">
          {systems.map((system, index) => {
            const isFocused = index === focusedIndex;
            const systemColor = systemColors[system.name?.toLowerCase()] || systemColors.default;
            return (
              <button
                key={system.id}
                className={`grid-card ${isFocused ? 'focused' : ''}`}
                style={{ '--card-color': systemColor } as React.CSSProperties}
                onClick={() => onSelectSystem(system)}
                disabled={loading}
              >
                <div className="grid-icon" style={{ backgroundColor: systemColor }}>
                  {system.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="grid-name">{system.display_name}</span>
                {isFocused && <div className="card-focus-ring" style={{ borderColor: systemColor }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── List layout ──────────────────────────────────────────
  if (systemView === 'list') {
    return (
      <div className="system-select-container">
        <div className="system-ambient" style={{ '--system-color': accentColor } as React.CSSProperties} />
        {header}
        <div className="systems-list">
          {systems.map((system, index) => {
            const isFocused = index === focusedIndex;
            const systemColor = systemColors[system.name?.toLowerCase()] || systemColors.default;
            return (
              <button
                key={system.id}
                className={`list-row ${isFocused ? 'focused' : ''}`}
                style={{ '--card-color': systemColor } as React.CSSProperties}
                onClick={() => onSelectSystem(system)}
                disabled={loading}
              >
                <div className="list-icon" style={{ backgroundColor: systemColor }}>
                  {system.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="list-name">{system.display_name}</span>
                {isFocused && <span className="list-arrow">▶</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Carousel layout (default) ────────────────────────────
  return (
    <div className="system-select-container">
      <div className="system-ambient" style={{ '--system-color': accentColor } as React.CSSProperties} />
      {header}
      <div className="carousel-wrapper">
        <div className="systems-carousel" ref={containerRef}>
          {systems.map((system, index) => {
            const isFocused = index === focusedIndex;
            const distance = Math.abs(index - focusedIndex);
            const systemColor = systemColors[system.name?.toLowerCase()] || systemColors.default;
            return (
              <button
                key={system.id}
                className={`system-card ${isFocused ? 'focused' : distance <= 2 ? 'visible' : 'hidden'}`}
                style={{ '--card-color': systemColor, '--card-distance': distance } as React.CSSProperties}
                onClick={() => onSelectSystem(system)}
                disabled={loading}
              >
                <div className="card-inner">
                  <div className="card-icon" style={{ backgroundColor: systemColor }}>
                    {system.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{system.display_name}</h3>
                    <span className="card-badge">{t('PLATFORM')}</span>
                  </div>
                </div>
                {isFocused && <div className="card-focus-ring" style={{ borderColor: systemColor }} />}
              </button>
            );
          })}
        </div>
        <div className="carousel-indicators">
          {systems.map((_, index) => (
            <div key={index} className={`indicator ${index === focusedIndex ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
