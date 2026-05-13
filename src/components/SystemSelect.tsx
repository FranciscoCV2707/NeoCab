import { useRef, useEffect } from "react";
import { t } from '../i18n';

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

export default function SystemSelect({
  systems,
  onSelectSystem,
  onBack,
  loading,
  focusedIndex,
}: SystemSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the container to keep the focused item centered
  useEffect(() => {
    if (containerRef.current) {
      const focusedElement = containerRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        const containerWidth = containerRef.current.clientWidth;
        const elementOffset = focusedElement.offsetLeft;
        const elementWidth = focusedElement.clientWidth;
        
        // Calculate scroll position to center the item
        const scrollPosition = elementOffset - (containerWidth / 2) + (elementWidth / 2);
        
        containerRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [focusedIndex, systems]);

  return (
    <div className="system-select-container premium-system-view">
      <div className="system-header-dynamic">
        <button className="back-button" onClick={onBack}>
          ← {t('BACK')}
        </button>
        <div className="system-title-display">
          <h1>{systems[focusedIndex]?.display_name || t('SELECT_SYSTEM')}</h1>
          <p className="system-subtitle">{t('CHOOSE_PLATFORM')}</p>
        </div>
        <div className="system-count">
          {focusedIndex + 1} / {systems.length}
        </div>
      </div>

      <div className="systems-carousel-container">
        <div className="systems-carousel" ref={containerRef}>
          {systems.map((system, index) => {
            const isFocused = index === focusedIndex;
            const distance = Math.abs(index - focusedIndex);
            
            // Calculate dynamic styles based on distance from focus
            let className = "system-card";
            if (isFocused) className += " focused";
            else if (distance === 1) className += " adjacent";
            else className += " hidden";

            return (
              <button
                key={system.id}
                className={className}
                onClick={() => onSelectSystem(system)}
                disabled={loading}
              >
                <div className="system-card-inner">
                  {/* System Logo/Icon Area */}
                  <div className="system-logo-container">
                    <div className="system-logo-fallback">
                      {system.display_name.charAt(0)}
                    </div>
                  </div>
                  
                  {/* System Info Area */}
                  <div className="system-card-info">
                    <h3 className="system-card-title">{system.display_name}</h3>
                    <div className="system-card-meta">
                      <span className="badge">{t('PLATFORM')}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Decorative background effects for current system */}
      <div className="system-ambient-light" />
    </div>
  );
}
