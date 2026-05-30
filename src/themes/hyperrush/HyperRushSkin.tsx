import React, { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { MediaShape, getSystemShape, getSystemHue } from '../../components/arcade/MediaShape';
import { Game, System } from '../../stores/types';
import type { View } from '../../stores/types';
import { ARCADE_MENU } from '../shared/menu';
import './hyperrush.css';

export interface SkinProps {
  currentView: View;
  systems: System[];
  games: Game[];
  focusedIndex: number;
  selectedSystem: System | null;
  loading: boolean;
  scanProgress: string;
  onSelectSystem: (system: System) => void;
  onPlayGame: (game: Game) => void;
  onBack: () => void;
  onShowSystems: () => void;
  onShowOperator: () => void;
  onShowSettings: () => void;
  onScanROMs: () => void;
}

function resolveAsset(path?: string) {
  if (!path) return undefined;
  try { return convertFileSrc(path); } catch { return path; }
}

const CARD_STRIDE = 380;

type Screen = 'menu' | 'systems' | 'games';

function HRMarquee({ headline, meta, tag = 'HYPERRUSH · v2.2' }: { headline: React.ReactNode; meta: React.ReactNode; tag?: string }) {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const time = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
  return (
    <div className="hr-marquee">
      <div className="hr-brand">
        <div className="hr-brand-mark">N</div>
        <div>
          <div className="hr-brand-name">NEOCAB</div>
          <div className="hr-brand-tag">{tag}</div>
        </div>
      </div>
      <div className="hr-marquee-title">
        <div className="hr-marquee-headline">{headline}</div>
        <div className="hr-marquee-meta">{meta}</div>
      </div>
      <div className="hr-status">
        <span className="led" />
        <span>LIVE</span>
        <b>{time}</b>
      </div>
    </div>
  );
}

// ── Reusable HyperRush games-screen blocks (foundation for widget-level
// composition). Output is identical to the previous inline JSX. ──
export function HRGamesPreview({ focused, selectedSystem, videoRef }:
  { focused?: Game; selectedSystem: System | null; videoRef: React.RefObject<HTMLVideoElement> }) {
  return (
    <div className="hr-crt-wrap">
      <div className="hr-crt">
        <div className="hr-crt-screen">
          {focused?.video_path ? (
            <video ref={videoRef} src={resolveAsset(focused.video_path)} autoPlay loop muted playsInline />
          ) : focused?.image_path ? (
            <img src={resolveAsset(focused.image_path)} alt={focused.title} />
          ) : focused ? (
            <div className="hr-crt-content">
              <div className="hr-crt-game-name">{focused.title.toUpperCase()}</div>
              {focused.developer && <div className="hr-crt-sub">{focused.developer.toUpperCase()}</div>}
              <div className="hr-crt-press">Insert Coin to Continue</div>
              <div className="hr-crt-copy">© {focused.year ?? '----'} · {selectedSystem?.display_name.toUpperCase()}</div>
            </div>
          ) : (
            <div className="hr-crt-fallback">
              <div className="glyph">NO SIGNAL</div>
              <div className="ttl">NO GAME</div>
              <div className="sub">selecciona un título</div>
            </div>
          )}
          <div className="hr-crt-scan" />
          <div className="hr-crt-rgb" />
          <div className="hr-crt-bulge" />
          <div className="hr-crt-roll" />
          <div className="hr-crt-corner tl">CH 03</div>
          <div className="hr-crt-corner tr">● REC</div>
          <div className="hr-crt-corner bl">RGB · 320×240</div>
          <div className="hr-crt-corner br">60.00 Hz</div>
        </div>
      </div>
    </div>
  );
}

export function HRGamesInfo({ focused, selectedSystem }:
  { focused?: Game; selectedSystem: System | null }) {
  return (
    <div className="hr-logo-block">
      {focused && (
        <>
          <div className="hr-logo-pill">
            <span className="sq" />
            <span>{selectedSystem?.display_name?.toUpperCase() ?? ''}</span>
            <span style={{ opacity: .55, marginLeft: 6 }}>·</span>
            <span style={{ opacity: .75 }}>{focused.year ?? '----'}</span>
          </div>
          <div className="hr-logo-big" key={focused.id}>{focused.title}</div>
          {focused.developer && <div className="hr-logo-sub">{focused.developer.toUpperCase()}</div>}
          <div className="hr-meta">
            <div className="hr-meta-cell"><div className="k">AÑO</div><div className="v">{focused.year ?? '—'}</div></div>
            <div className="hr-meta-cell"><div className="k">MAKER</div><div className="v">{focused.developer ?? '—'}</div></div>
            <div className="hr-meta-cell"><div className="k">GÉNERO</div><div className="v">{focused.genre ?? '—'}</div></div>
            <div className="hr-meta-cell"><div className="k">PLAYERS</div><div className="v">{focused.players ?? '—'}</div></div>
            <div className="hr-meta-cell"><div className="k">SISTEMA</div><div className="v">{selectedSystem?.display_name ?? '—'}</div></div>
            <div className="hr-meta-cell"><div className="k">PARTIDAS</div><div className="v hi">{String(focused.play_count ?? 0).padStart(4,'0')}</div></div>
          </div>
        </>
      )}
    </div>
  );
}

export function HRGamesWheel({ games, focusedIndex, loading, selectedSystem, listRef, offset, onPlayGame }:
  { games: Game[]; focusedIndex: number; loading: boolean; selectedSystem: System | null;
    listRef: React.RefObject<HTMLDivElement>; offset: number; onPlayGame: (g: Game) => void }) {
  return (
    <div className="hr-wheel-col">
      <div className="hr-wheel-head">
        <span>NOW BROWSING</span>
        <span className="v">{games.length ? String(focusedIndex + 1).padStart(2, '0') : '--'}</span>
        <span style={{ opacity: .4 }}>/</span>
        <span className="v" style={{ color: 'rgba(255,255,255,.5)' }}>{String(games.length).padStart(2, '0')}</span>
      </div>
      <div className="hr-wheel-frame" ref={listRef}>
        <div className="hr-wheel-track" style={{ transform: `translateY(${offset}px)` }}>
          {games.map((game, si) => {
            const ri  = si;
            const d   = ri - focusedIndex;
            const abs = Math.abs(d);
            const cls = `hr-wheel-item${d === 0 ? ' active' : abs === 1 ? ' n1' : abs === 2 ? ' n2' : ' f'}`;
            const [h] = selectedSystem ? getSystemHue(selectedSystem.name) : [35];
            return (
              <div key={game.id} className={cls} style={{ '--c-h': h } as React.CSSProperties}>
                <button className={`hr-wheel-card${game.is_favorite === 1 ? ' fav' : ''}`}
                  tabIndex={-1} disabled={loading}
                  onClick={() => !loading && onPlayGame(game)}>
                  <span className="num">{String(ri + 1).padStart(2, '0')}</span>
                  <span className="ttl">{game.title}</span>
                  <span className="star" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="hr-wheel-rail" />
      </div>
    </div>
  );
}

export function HyperRushSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading, scanProgress,
  onSelectSystem, onPlayGame, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
  variant = 'rush',
}: SkinProps & { variant?: 'rush' | 'wheel' }) {
  const menuActions: Record<string, () => void> = {
    play: onShowSystems,
    scan: onScanROMs,
    settings: onShowSettings,
    operator: onShowOperator,
  };
  const videoRef  = useRef<HTMLVideoElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const prevView = useRef<Screen>(currentView as Screen);
  const [changing, setChanging] = useState(false);

  const view: Screen = currentView === 'menu' || currentView === 'systems' || currentView === 'games'
    ? currentView as Screen
    : 'menu';

  const sys = systems[focusedIndex];
  const focused = view === 'games' ? games[focusedIndex] : undefined;

  useEffect(() => {
    const root = document.querySelector('.theme-hyperrush') as HTMLElement | null;
    if (!root) return;
    if (variant === 'wheel') {
      // HyperWheel keeps a fixed electric-blue identity across all systems
      // (HyperRush, by contrast, recolors per selected system).
      root.style.setProperty('--hr-h', '200');
      root.style.setProperty('--hr-h2', '280');
      return;
    }
    let h = 35, h2 = 320;
    if (view === 'systems' && systems[focusedIndex]) [h, h2] = getSystemHue(systems[focusedIndex].name);
    else if (view === 'games' && selectedSystem) [h, h2] = getSystemHue(selectedSystem.name);
    root.style.setProperty('--hr-h',  String(h));
    root.style.setProperty('--hr-h2', String(h2));
  }, [view, focusedIndex, systems, selectedSystem, variant]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  useEffect(() => {
    if (prevView.current !== view) {
      setChanging(true);
      const t = setTimeout(() => setChanging(false), 460);
      prevView.current = view;
      return () => clearTimeout(t);
    }
  }, [view]);

  useEffect(() => {
    if (listRef.current && view === 'games') {
      const rowH = 82;
      listRef.current.scrollTop = Math.max(0, (focusedIndex - 3) * rowH);
    }
  }, [focusedIndex, view]);

  const offset = -(focusedIndex * 92) - 46;

  const totals = {
    titles: systems.reduce((n, s) => n + (s.game_count ?? 0), 0),
    systems: systems.length,
    favorites: games.filter(g => g.is_favorite === 1).length,
  };

  let marqueeHeadline: React.ReactNode, marqueeMeta: React.ReactNode;
  if (view === 'menu') {
    marqueeHeadline = <><span>MAIN MENU</span><span className="sep">/</span><span>WELCOME</span></>;
    marqueeMeta = <>
      <span><b>{systems.length}</b> SYSTEMS</span>
      <span><b>{totals.titles}</b> TITLES</span>
      <span><b>{totals.favorites}</b> FAVORITES</span>
      <span>FREEPLAY · ON</span>
    </>;
  } else if (view === 'systems') {
    marqueeHeadline = <><span>SELECT</span><span className="sep">/</span><span>SYSTEM</span></>;
    marqueeMeta = <>
      <span><b>{sys?.game_count ?? 0}</b> TITLES</span>
      <span>KIND · PLATFORM</span>
      <span>{sys?.name ?? ''}</span>
      <span>REGION · WORLD</span>
    </>;
  } else {
    marqueeHeadline = <><span>NOW PLAYING</span><span className="sep">/</span><span>{selectedSystem?.display_name?.toUpperCase() ?? ''}</span></>;
    marqueeMeta = <>
      <span><b>{games.length}</b> TITLES</span>
      <span>GAME · {focusedIndex + 1} / {games.length}</span>
      <span>{selectedSystem?.display_name ?? ''}</span>
      <span>FREEPLAY · ON</span>
    </>;
  }

  const translateX = `calc(-${focusedIndex * CARD_STRIDE}px - ${CARD_STRIDE / 2}px)`;

  return (
    <div className={`theme-hyperrush${variant === 'wheel' ? ' hr-variant-wheel' : ''}`}>
      <div className="hr-bg">
        <div className="hr-bg-rays" />
        <div className="hr-bg-grid" />
      </div>
      <div className="hr-scan" />
      <div className="hr-vignette" />
      <div className="hr-noise" />

      <div className="hr-shell">
        <HRMarquee headline={marqueeHeadline} meta={marqueeMeta} tag={variant === 'wheel' ? 'HYPERWHEEL · v2.2' : 'HYPERRUSH · v2.2'} />
        <div className="hr-main">

          {/* ── HOME ── */}
          {view === 'menu' && (
            <div className="hr-home">
              <div className="hr-home-left">
                <div className="hr-home-eyebrow">
                  <span className="dot" />
                  <span>SYSTEM ONLINE · CRT WARM · BUILD 0.7</span>
                </div>
                <div className="hr-home-mark">
                  <div className="hr-home-mark-line">NEO</div>
                  <div className="hr-home-mark-line two">CAB</div>
                  <div className="hr-home-mark-sub">HYPER<span className="amber">WHEEL</span> · ARCADE FRONTEND</div>
                </div>
                <div className="hr-home-stats">
                  <div className="hr-home-stat"><div className="k">Total titles</div><div className="v">{totals.titles.toLocaleString()}</div></div>
                  <div className="hr-home-stat"><div className="k">Systems</div><div className="v">{totals.systems}</div></div>
                  <div className="hr-home-stat"><div className="k">Favorites</div><div className="v">{totals.favorites}</div></div>
                  <div className="hr-home-stat"><div className="k">Last session</div><div className="v">TODAY</div></div>
                </div>
                <div className="hr-home-ticker">
                  <span className="ttl">NOW SHOWING</span>
                  <div className="hr-home-ticker-track">
                    <div className="hr-home-ticker-inner">
                      {['METAL SLUG', 'KOF 98', 'STREET FIGHTER II', 'SNOW BROS', 'FINAL FIGHT', 'GAROU MOTW', 'MARVEL VS CAPCOM', 'CADILLACS'].map((t, i) => (
                        <React.Fragment key={i}><span>{t}</span><span className="pip">◆</span></React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hr-home-right">
                <div className="hr-home-menu-head">
                  <span className="line" />
                  <span className="lbl">MAIN MENU</span>
                  <span className="line" />
                </div>
                <div className="hr-home-menu">
                  {ARCADE_MENU.map((item, i) => (
                      <button key={item.id} className={`hr-menu-item${i === focusedIndex ? ' active' : ''}`}
                        onClick={() => menuActions[item.id]?.()} tabIndex={-1}>
                        <span className="mi-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="mi-icon">{item.icon}</span>
                        <span className="mi-body">
                          <span className="mi-label">{item.label}</span>
                          <span className="mi-tag">{item.sub}</span>
                        </span>
                        {i === focusedIndex && <span className="mi-arrow">▶</span>}
                      </button>
                  ))}
                </div>
                <div className="hr-home-credits">INSERT COIN · CREDITS <b>99</b> · FREE PLAY MODE</div>
              </div>
            </div>
          )}

{/* ── SYSTEMS CAROUSEL ── */}
          {view === 'systems' && (
            <div className="hr-systems-screen">
              <div className="hr-systems-head">
                <div className="hr-systems-eyebrow">
                  <span className="sq" />
                  <span>SELECT SYSTEM</span>
                  <span style={{ opacity: .5 }}>·</span>
                  <span style={{ opacity: .5 }}>{systems.length} LIBRARIES</span>
                </div>
                <div className="hr-systems-titlewrap">
                  <div className="hr-systems-kind">PLATFORM · {String(focusedIndex + 1).padStart(2, '0')} / {String(systems.length).padStart(2, '0')}</div>
                  <div className="hr-systems-name">{sys?.display_name?.toUpperCase() ?? '—'}</div>
                  <div className="hr-systems-tag">{sys?.name ?? ''}</div>
                </div>
                <div className="hr-systems-counter">
                  <div className="hr-systems-counter-v">{sys?.game_count ?? 0}</div>
                  <div className="hr-systems-counter-k">titles</div>
                </div>
              </div>

              <div className="hr-carousel">
                <div className="hr-carousel-track" style={{ transform: `translate(${translateX}, -50%)` }}>
                  {systems.map((s, i) => {
                    const d = i - focusedIndex;
                    const abs = Math.abs(d);
                    const scale = abs === 0 ? 1 : abs === 1 ? .78 : abs === 2 ? .6 : .46;
                    const rotY = d * -16;
                    const opacity = abs === 0 ? 1 : abs === 1 ? .88 : abs === 2 ? .55 : .2;
                    const blur = abs === 0 ? 0 : abs === 1 ? .3 : abs === 2 ? 1.2 : 2.4;
                    const [h] = getSystemHue(s.name);
                    return (
                      <div
                        key={s.id}
                        className={`hr-sys-card${d === 0 ? ' active' : ''}`}
                        style={{
                          transform: `scale(${scale}) rotateY(${rotY}deg)`,
                          opacity, filter: `blur(${blur}px)`, zIndex: 100 - abs,
                          '--c-h': h, '--c-h2': h,
                        } as React.CSSProperties}
                        onClick={() => onSelectSystem(s)}>
                        <div className="hr-sys-card-bg" />
                        <div className="hr-sys-card-grid" />
                        <div className="hr-sys-card-kind">■ PLATFORM</div>
                        <div className="hr-sys-card-media">
                          <MediaShape shape={getSystemShape(s.name)} hue={h} short={s.name.slice(0,4).toUpperCase()} />
                        </div>
                        <div className="hr-sys-card-body">
                          <div className="hr-sys-card-name">{s.display_name}</div>
                          <div className="hr-sys-card-tag">{s.name}</div>
                          <div className="hr-sys-card-foot">
                            <span className="hr-sys-card-count">{s.game_count ?? 0}</span>
                            <span className="hr-sys-card-count-k">TITLES</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hr-pointer" />
              </div>

              <div className="hr-system-rail">
                {systems.slice(0, 12).map((s, i) => {
                  const [h] = getSystemHue(s.name);
                  return (
                    <div key={s.id} className={`hr-rail-dot${i === focusedIndex ? ' active' : ''}`}
                      style={{ '--bat-accent': `oklch(72% 0.18 ${h})` } as React.CSSProperties}
                      onClick={() => onSelectSystem(s)} tabIndex={-1}>
                      <span className="lbl">{s.name.slice(0,4).toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GAMES ── */}
          {view === 'games' && (
            <div className="hr-wheel-screen">
              <HRGamesPreview focused={focused} selectedSystem={selectedSystem} videoRef={videoRef} />
              <HRGamesInfo focused={focused} selectedSystem={selectedSystem} />
              <HRGamesWheel games={games} focusedIndex={focusedIndex} loading={loading}
                selectedSystem={selectedSystem} listRef={listRef} offset={offset} onPlayGame={onPlayGame} />
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="hr-controls">
          {view === 'games' ? (
            <>
              <div className="hr-ctl"><span className="btn g">A</span><span className="lbl"><b>Jugar</b><span>start game</span></span></div>
              <div className="hr-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>main menu</span></span></div>
              <div className="hr-ctl"><span className="btn y">Y</span><span className="lbl"><b>Favorito</b><span>pin · scrape</span></span></div>
              <div className="hr-ctl"><span className="btn b">X</span><span className="lbl"><b>Info</b><span>cheats · stats</span></span></div>
              <div className="spacer" />
              <div className="hr-coin"><span className="pip">25¢</span><span>Créditos</span><span className="v">99</span></div>
            </>
          ) : view === 'systems' ? (
            <>
              <div className="hr-ctl"><span className="btn g">A</span><span className="lbl"><b>Seleccionar</b><span>ver juegos</span></span></div>
              <div className="hr-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>menú</span></span></div>
              <div className="spacer" />
              <div className="hr-ctl"><span className="btn y">Y</span><span className="lbl"><b>Filtro</b><span>ver juegos</span></span></div>
            </>
          ) : (
            <>
              <div className="hr-ctl"><span className="btn g">A</span><span className="lbl"><b>Seleccionar</b><span>entrar al menú</span></span></div>
              <div className="hr-ctl"><span className="btn r">B</span><span className="lbl"><b>Salir</b><span>apagar</span></span></div>
              <div className="hr-ctl"><span className="btn y">Y</span><span className="lbl"><b>Acerca</b><span>info cabina</span></span></div>
              <div className="hr-ctl"><span className="btn b">X</span><span className="lbl"><b>Temas</b><span>cambiar tema</span></span></div>
              {loading && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.28em', color: 'rgba(255,243,212,.4)', textTransform: 'uppercase', marginLeft: 16 }}>{scanProgress}</span>}
              <div className="spacer" />
            </>
          )}
        </div>
      </div>

      {/* CRT channel-change transition */}
      {changing && (
        <div className="hr-chan">
          <div className="hr-chan-bar" />
          <div className="hr-chan-static" />
        </div>
      )}
    </div>
  );
}

// Keep the old export for backward compatibility
export default HyperRushSkin;