import React, { useEffect, useRef, useState } from 'react';
import { THEME_REGISTRY, SKIN_TOKENS, type ThemeEntry } from './registry';
import { useThemeStore, type Theme, injectThemeCss } from '../stores/useThemeStore';
import { ThemeTransition } from './ThemeTransition';
import './ThemeSwitcher.css';

interface ThemeSwitcherProps {
  onClose: () => void;
}

// Build a valid Theme from a registry entry, merging with a base if available
function buildTheme(entry: ThemeEntry, base: Theme | null): Theme {
  const tok = SKIN_TOKENS[entry.skin];
  const defaults: Theme = {
    name: entry.name,
    version: entry.version,
    author: 'NeoCab',
    description: entry.description,
    skin: entry.skin,
    hw: { base_hue: tok.h, base_hue2: tok.h2 },
    colors: {
      primary: tok.accent,
      secondary: '#1a1a2e',
      accent: tok.accent,
      highlight: tok.accentHot,
      text: tok.text,
      background: tok.bg,
    },
    fonts: {
      ui: 'Bebas Neue',
      title: 'Russo One',
      subtitle: 'JetBrains Mono',
      mono: 'JetBrains Mono',
    },
    layout: {
      system_view: 'wheel',
      game_view: 'list',
      wheel_style: 'vertical',
      transition: 'fade',
      animation_speed: 300,
      easing: 'cubic-bezier(0.4,0,0.2,1)',
    },
    background: { type: 'color', color: '#04030a', gradient: null, image: null, video: null, opacity: 1, blur: 0, overlay_color: null },
    effects: {
      scanlines: entry.effects.scanlines,
      crt_curve: entry.effects.crt_curve,
      glow_intensity: entry.effects.glow_intensity,
      shadow_enabled: entry.effects.shadow_enabled,
      vignette: entry.effects.vignette,
      noise: entry.effects.noise,
      blur_unselected: entry.effects.blur_unselected,
    },
  };
  const DEFAULT_BG = { type: 'color' as const, color: '#04030a', gradient: null, image: null, video: null, opacity: 1, blur: 0, overlay_color: null };
  if (!base) return defaults;
  return {
    ...base,
    name: entry.name,
    skin: entry.skin,
    hw: { base_hue: tok.h, base_hue2: tok.h2 },
    colors: { ...base.colors, ...defaults.colors },
    effects: { ...base.effects, ...entry.effects },
    background: base.background ?? DEFAULT_BG,
  };
}

// ── Preview SVGs per skin ─────────────────────────────────────────────────

function PreviewSVG({ entry }: { entry: ThemeEntry }) {
  const acc = entry.accent;
  const h = entry.hw.base_hue;
  const h2 = entry.hw.base_hue2;

  switch (entry.id) {
    case 'hyperwheel':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#04030a"/>
          <ellipse cx="160" cy="100" rx="100" ry="60" fill={`oklch(28% .18 ${h} / .5)`}/>
          {[-40,-20,0,20,40].map((dy, i) => (
            <rect key={i} x={i===2?122:128} y={100+dy-14+(i===2?-4:0)} width={i===2?76:64} height={i===2?36:24}
              rx="4" fill={i===2?`oklch(60% .28 ${h})`:`oklch(28% .14 ${h} / .7)`}
              stroke={i===2?`oklch(70% .28 ${h})`:'none'} strokeWidth={i===2?1:0}/>
          ))}
          <rect x="20" y="30" width="90" height="66" rx="6" fill={`oklch(12% .06 ${h2})`} stroke={`oklch(40% .14 ${h2} / .5)`} strokeWidth="1"/>
          <rect x="26" y="36" width="78" height="54" rx="3" fill={`oklch(22% .10 ${h2} / .8)`}/>
        </svg>
      );
    case 'hyperrush':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#04030a"/>
          <ellipse cx="160" cy="60" rx="140" ry="80" fill={`oklch(30% .22 ${h} / .6)`}/>
          <rect x="20" y="10" width="180" height="100" rx="6" fill={`oklch(10% .06 ${h})`} stroke={`oklch(55% .22 ${h} / .4)`} strokeWidth="1"/>
          <rect x="26" y="16" width="168" height="88" rx="3" fill={`oklch(20% .12 ${h} / .9)`}/>
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={218+(i===2?-4:0)} y={12+i*36+(i===2?-4:0)} width={i===2?88:80} height={i===2?32:24}
              rx="3" fill={i===2?`oklch(58% .26 ${h2})`:`oklch(22% .12 ${h2} / .7)`}/>
          ))}
        </svg>
      );
    case 'neonwall':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#030610"/>
          {Array.from({length:12}).map((_,i) => {
            const col = i % 4, row = Math.floor(i/4);
            return (
              <rect key={i} x={8+col*78} y={8+row*60} width="72" height="54" rx="4"
                fill={i===5?`oklch(22% .18 ${h} / .9)`:`oklch(10% .08 ${h} / .6)`}
                stroke={i===5?`oklch(65% .28 ${h})`:`oklch(35% .18 ${h} / .4)`} strokeWidth={i===5?1.5:1}/>
            );
          })}
          <line x1="0" y1="182" x2="320" y2="182" stroke={`oklch(55% .26 ${h2})`} strokeWidth="1" strokeOpacity=".4"/>
        </svg>
      );
    case 'batocera':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#0f0d18"/>
          <rect x="0" y="0" width="110" height="200" fill="#16131f"/>
          {[0,1,2,3,4].map(i => (
            <React.Fragment key={i}>
              <rect x="8" y={16+i*36} width="94" height="28" rx="4"
                fill={i===1?`${acc}22`:'transparent'} stroke={i===1?acc:'none'}/>
              <rect x="14" y={22+i*36} width="16" height="16" rx="3" fill={i===1?acc:`#ffffff22`}/>
              <rect x="36" y={25+i*36} width={60-i*4} height="4" rx="2" fill={i===1?'#fff':`#ffffff44`}/>
            </React.Fragment>
          ))}
          <rect x="122" y="10" width="188" height="118" rx="6" fill="#1a1626"/>
        </svg>
      );
    case 'flux':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#08060f"/>
          <defs>
            <linearGradient id="fxg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={`oklch(35% .20 ${h})`} stopOpacity=".8"/>
              <stop offset="1" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <ellipse cx="90" cy="100" rx="160" ry="100" fill="url(#fxg)"/>
          <polygon points="10,40 200,10 210,190 10,200" fill={`oklch(14% .08 ${h} / .7)`} stroke={`oklch(40% .18 ${h} / .3)`} strokeWidth="1"/>
          <text x="20" y="100" fontFamily="Russo One" fontSize="40" fill={`oklch(55% .22 ${h})`} letterSpacing="-1">GAME</text>
          <rect x="218" y="10" width="92" height="180" rx="4" fill={`oklch(10% .06 ${h2} / .8)`}/>
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x="224" y={18+i*28} width="80" height="20" rx="3" fill={`oklch(18% .10 ${h2} / .7)`}/>
          ))}
        </svg>
      );
    case 'operator':
      return (
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="200" fill="#010805"/>
          {Array.from({length:8}).map((_,i) => (
            <line key={i} x1="0" y1={i*26} x2="320" y2={i*26} stroke={acc} strokeOpacity=".07" strokeWidth=".5"/>
          ))}
          {[0,1,2,3,4,5,6].map(i => (
            <text key={i} x="10" y={20+i*26} fontFamily="JetBrains Mono" fontSize="9" fill={i===2?acc:`${acc}55`} letterSpacing="2">
              {['> SYSTEM ONLINE','> LISTING ROMS...','> ARCADE  412  TITLES','> SNES    612  TITLES','> PSX    1204  TITLES','> N64     248  TITLES','> [ENTER TO SELECT]'][i]}
            </text>
          ))}
          <rect x="0" y="178" width="320" height="22" fill={`${acc}11`}/>
          <text x="10" y="193" fontFamily="JetBrains Mono" fontSize="9" fill={acc} letterSpacing="3">NEOCAB OPERATOR · v2.2.0</text>
        </svg>
      );
    default:
      return <svg viewBox="0 0 320 200"><rect width="320" height="200" fill="#04030a"/></svg>;
  }
}

// ── Main component ────────────────────────────────────────────────────────

export function ThemeSwitcher({ onClose }: ThemeSwitcherProps) {
  const { currentTheme, applyTheme } = useThemeStore();

  // Snapshot original so we can revert on cancel
  const originalTheme = useRef<Theme | null>(currentTheme);

  const activeId = currentTheme?.name?.toLowerCase().replace(/\s+/g, '') ?? 'hyperwheel';
  const initIdx = Math.max(0, THEME_REGISTRY.findIndex(t => t.id === activeId));

  const [focusIdx, setFocusIdx]     = useState(initIdx);
  const [selectedId, setSelectedId] = useState<string | null>(activeId);
  const [saved, setSaved]           = useState(false);
  const [transPhase, setTransPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [transEntry, setTransEntry] = useState<ThemeEntry | null>(null);
  const transRef = useRef(false);

  // Preview: apply theme visually without persisting to localStorage yet
  const previewEntry = (entry: ThemeEntry) => {
    const theme = buildTheme(entry, originalTheme.current);
    injectThemeCss(theme);
    // Update store so skin routing (App.tsx activeSkin) reacts
    useThemeStore.setState({ currentTheme: theme });
  };

  const saveAndClose = () => {
    const entry = THEME_REGISTRY[focusIdx];
    if (!entry || entry.status === 'planned' || transRef.current) return;

    transRef.current = true;
    setTransEntry(entry);
    setTransPhase('out');

    setTimeout(() => {
      const theme = buildTheme(entry, originalTheme.current);
      applyTheme(theme);
      localStorage.setItem('neocab_theme_id', entry.id);
      setSaved(true);
      setTransPhase('in');
      setTimeout(() => {
        setTransPhase('idle');
        setTransEntry(null);
        transRef.current = false;
        onClose();
      }, 820);
    }, 500);
  };

  const cancelAndClose = () => {
    // Restore original theme
    if (originalTheme.current) {
      applyTheme(originalTheme.current);
    }
    onClose();
  };

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusIdx(i => (i + 1) % THEME_REGISTRY.length);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusIdx(i => (i - 1 + THEME_REGISTRY.length) % THEME_REGISTRY.length);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        saveAndClose();
        e.preventDefault();
      } else if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
        cancelAndClose();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIdx]);

  // Preview on focus change
  useEffect(() => {
    const entry = THEME_REGISTRY[focusIdx];
    if (entry && entry.status === 'available') previewEntry(entry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIdx]);

  const focusedEntry = THEME_REGISTRY[focusIdx];
  const canSave = focusedEntry?.status === 'available';

  return (
    <div className="ts-overlay" onClick={e => { if (e.target === e.currentTarget) cancelAndClose(); }}>
      <div className="ts-head">
        <div className="ts-head-left">
          <div className="ts-eyebrow">NEOCAB · THEME PACK · v1.0</div>
          <div className="ts-title">SELECT <b>THEME</b></div>
          <div className="ts-sub">
            {THEME_REGISTRY.filter(t => t.status === 'available').length} disponibles
            · {THEME_REGISTRY.filter(t => t.status === 'planned').length} en desarrollo
          </div>
        </div>
        <div className="ts-head-right">
          <div>{THEME_REGISTRY.length} THEMES · NeoCab v2.2</div>
          <div><b>Cabinet</b> · 1920×1080 · 16:9</div>
        </div>
      </div>

      <div className="ts-grid">
        {THEME_REGISTRY.map((entry, i) => (
          <button
            key={entry.id}
            className={[
              'ts-card',
              i === focusIdx  ? 'focused'  : '',
              entry.id === selectedId ? 'active' : '',
              entry.status === 'planned' ? 'planned' : '',
            ].filter(Boolean).join(' ')}
            style={{ '--accent': entry.accent } as React.CSSProperties}
            onMouseEnter={() => setFocusIdx(i)}
            onClick={() => {
              if (entry.status === 'planned') return;
              setFocusIdx(i);
              setSelectedId(entry.id);
            }}
          >
            <div className="ts-preview">
              <PreviewSVG entry={entry} />
              <div className="ts-preview-noise" />
              <div className="ts-preview-scan" />
              {entry.status === 'planned' && <div className="ts-planned-tag">PRÓXIMO</div>}
            </div>
            <div className="ts-card-body">
              <div className="ts-card-name">{entry.name}</div>
              <div className="ts-card-tagline">{entry.tagline}</div>
              <div className="ts-card-insp">INSP · {entry.inspiration}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="ts-foot">
        <div className="ts-keys">
          <span><span className="ts-kk">← →</span>Navegar</span>
          <span><span className="ts-kk">ENTER</span>Guardar</span>
          <span><span className="ts-kk">ESC</span>Cancelar</span>
        </div>
        <div className="ts-foot-actions">
          <button className="ts-btn-cancel" onClick={cancelAndClose}>
            CANCELAR
          </button>
          <button
            className={`ts-btn-save${saved ? ' saved' : ''}${!canSave ? ' disabled' : ''}`}
            onClick={saveAndClose}
            disabled={!canSave}
          >
            {saved ? '✓ GUARDADO' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>

      <ThemeTransition phase={transPhase} incoming={transEntry} />
    </div>
  );
}
