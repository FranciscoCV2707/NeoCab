import React, { useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getSystemHue, MediaShape, getSystemShape } from '../../components/arcade/MediaShape';
import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { ARCADE_MENU } from '../shared/menu';
import { useGameStore } from '../../stores/useGameStore';
import './neonwall.css';

function resolveAsset(path?: string) {
  if (!path) return undefined;
  try { return convertFileSrc(path); } catch { return path; }
}

function useClock() {
  const [t, setT] = React.useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
}

const NW_MENU_HUES: Record<string, number> = {
  play: 270, favs: 320, recent: 165, shuffle: 50, settings: 210, operator: 290, scan: 195,
};

const CV_RADIUS = 6;
const BULB_COUNT = 18;

function cvTransform(d: number): string {
  const sign = Math.sign(d), abs = Math.abs(d);
  const x = d === 0 ? 0 : sign * (150 + (abs - 1) * 92);
  const rotY = d === 0 ? 0 : -sign * 46;
  const scale = d === 0 ? 1.18 : Math.max(0.5, 0.9 - (abs - 1) * 0.1);
  const z = d === 0 ? 130 : -abs * 55;
  return `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
}

export function NeonWallSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading,
  onSelectSystem, onPlayGame, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: SkinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const time = useClock();
  const setFocusedIndex = useGameStore(s => s.setFocusedIndex);

  useEffect(() => {
    const root = document.querySelector('.theme-neonwall') as HTMLElement | null;
    if (!root) return;
    let h = 270, h2 = 340;
    if (currentView === 'systems' && systems[focusedIndex]) [h, h2] = getSystemHue(systems[focusedIndex].name);
    else if (currentView === 'games' && selectedSystem) [h, h2] = getSystemHue(selectedSystem.name);
    root.style.setProperty('--nw-h', String(h));
    root.style.setProperty('--nw-h2', String(h2));
  }, [currentView, focusedIndex, systems, selectedSystem]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  const focused = currentView === 'games' ? games[focusedIndex] : undefined;
  const focSys  = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);

  const totals = {
    titles: systems.reduce((n, s) => n + (s.game_count ?? 0), 0),
    systems: systems.length,
    favorites: games.filter(g => g.is_favorite === 1).length,
  };

  const collectionLabel =
    currentView === 'menu'    ? 'MAIN MENU' :
    currentView === 'systems' ? (focSys?.display_name.toUpperCase() ?? 'SYSTEMS') :
    selectedSystem?.display_name.toUpperCase() ?? 'ARCADE';

  // Coverflow tiles window
  const cvLen = games.length;
  const wrapIdx = (n: number) => cvLen ? ((n % cvLen) + cvLen) % cvLen : 0;
  const cvTiles: { d: number; g: typeof games[0] | null }[] = [];
  for (let d = -CV_RADIUS; d <= CV_RADIUS; d++) {
    cvTiles.push({ d, g: cvLen ? games[wrapIdx(focusedIndex + d)] : null });
  }

  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => (
    <span key={i} className="b" />
  ));

  return (
    <div className="theme-neonwall">
      <div className="nw-bg">
        <div className="nw-bg-rays" />
        <div className="nw-bg-tex" />
      </div>

      {/* ── HOME: cinematic poster wall ── */}
      {currentView === 'menu' && (
        <div className="nw-home">
          <div className="nw-top">
            <div className="nw-brand">
              <div className="nw-brand-mark">N</div>
              <div>
                <div className="nw-brand-name">NEOCAB</div>
                <div className="nw-brand-sub">Neon Wall · Cinema Mode</div>
              </div>
            </div>
            <div className="nw-time">
              <span className="led" /><span>LIVE</span>
              <span style={{ opacity: .5 }}>·</span>
              <b>{time}</b>
            </div>
          </div>

          <div className="nw-home-hero">
            <div className="nw-home-eyebrow">
              <span className="led" />
              <span>SYSTEM ONLINE · CABINET READY · FREEPLAY ON</span>
            </div>
            <div className="nw-home-logo">NEO<span className="accent">CAB</span></div>
            <div className="nw-home-tagline">
              A wall of light for the big cabinet. Step up, pick a system, and let the marquee do the talking.
            </div>
            <div className="nw-home-statline">
              <div className="cell"><span className="v">{totals.titles.toLocaleString()}</span><span className="k">Titles</span></div>
              <div className="cell"><span className="v">{totals.systems}</span><span className="k">Systems</span></div>
              <div className="cell"><span className="v hi">{totals.favorites}</span><span className="k">Favorites</span></div>
              <div className="cell"><span className="v">TODAY</span><span className="k">Last Session</span></div>
            </div>
          </div>

          <div className="nw-home-rail-wrap">
            <div className="nw-home-rail-head">
              <span>MAIN MENU</span>
              <div className="line" />
              <span>← → SELECT · ENTER OPEN</span>
            </div>
            <div className="nw-home-rail">
              {ARCADE_MENU.map((it, i) => (
                <div key={it.id}
                  className={`nw-home-poster${i === focusedIndex ? ' active' : ''}`}
                  style={{ '--p-h': NW_MENU_HUES[it.id] ?? 270 } as React.CSSProperties}
                  onClick={() => {
                    if (it.id === 'play') onShowSystems();
                    else if (it.id === 'scan') onScanROMs();
                    else if (it.id === 'settings') onShowSettings();
                    else if (it.id === 'operator') onShowOperator();
                  }}>
                  <div className="nw-home-poster-bg" />
                  <div className="nw-home-poster-strip" />
                  <div className="nw-home-poster-num">
                    {String(i + 1).padStart(2, '0')} / {String(ARCADE_MENU.length).padStart(2, '0')}
                  </div>
                  <div className="nw-home-poster-ic">{it.icon}</div>
                  <div className="nw-home-poster-body">
                    <div className="nw-home-poster-label">{it.label}</div>
                    <div className="nw-home-poster-tag">{it.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="nw-controls">
            <div className="ctl"><span className="kk g">A</span><b>Select</b></div>
            <div className="ctl"><span className="kk r">B</span><b>Exit</b></div>
            <div className="spacer" />
            <div className="ctl" style={{ opacity: .6 }}><span>← → menu</span></div>
          </div>
        </div>
      )}

      {/* ── SYSTEMS: 3D carousel ── */}
      {currentView === 'systems' && (
        <div className="nw-sys-screen">
          <div className="nw-sys-head">
            <div className="nw-sys-eyebrow">
              <span className="dot" />
              <span>Select a System · {String(focusedIndex + 1).padStart(2, '0')} / {String(systems.length).padStart(2, '0')}</span>
            </div>
            <div className="nw-sys-title">{focSys?.display_name?.toUpperCase() ?? '—'}</div>
            <div className="nw-sys-sub">{focSys?.name ?? ''} · {focSys?.game_count ?? 0} titles</div>
          </div>

          <div className="nw-sys-stage">
            <div className="nw-sys-floor" />
            <div className="nw-sys-track" style={{ transform: `translate(calc(-${focusedIndex * 348}px - 174px), -50%)` }}>
              {systems.map((s, i) => {
                const d = i - focusedIndex;
                const abs = Math.abs(d);
                const scale = abs === 0 ? 1 : abs === 1 ? .82 : abs === 2 ? .62 : .46;
                const rotY = d * -16;
                const opacity = abs === 0 ? 1 : abs === 1 ? .85 : abs === 2 ? .45 : .15;
                const blur = abs === 0 ? 0 : abs === 1 ? .4 : abs === 2 ? 1.4 : 2.6;
                const [h, h2] = getSystemHue(s.name);
                return (
                  <div key={s.id}
                    className={`nw-sys-card${d === 0 ? ' active' : ''}`}
                    style={{
                      transform: `scale(${scale}) rotateY(${rotY}deg)`,
                      opacity, filter: `blur(${blur}px)`, zIndex: 100 - abs,
                      '--c-h': h, '--c-h2': h2,
                    } as React.CSSProperties}
                    onClick={() => onSelectSystem(s)}>
                    <div className="nw-sys-card-bg" />
                    <div className="nw-sys-card-kind">■ PLATFORM</div>
                    <div className="nw-sys-card-media">
                      <MediaShape shape={getSystemShape(s.name)} hue={h} short={s.name.slice(0, 4).toUpperCase()} />
                    </div>
                    <div className="nw-sys-card-body">
                      <div className="nw-sys-card-name">{s.display_name}</div>
                      <div className="nw-sys-card-tag">{s.name}</div>
                      <div className="nw-sys-card-foot">
                        <span className="nw-sys-card-count">{s.game_count ?? 0}</span>
                        <span className="nw-sys-card-count-k">TITLES</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="nw-sys-rail">
            {systems.map((s, i) => {
              const [h] = getSystemHue(s.name);
              return (
                <div key={s.id}
                  className={`nw-sys-pill${i === focusedIndex ? ' active' : ''}`}
                  style={{ '--c-h': h } as React.CSSProperties}
                  onClick={() => onSelectSystem(s)}>
                  <span className="short">{s.name.slice(0, 4).toUpperCase()}</span>
                  <span>{s.display_name}</span>
                </div>
              );
            })}
          </div>

          <div className="nw-controls" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
            <div className="ctl"><span className="kk g">A</span><b>Enter</b></div>
            <div className="ctl"><span className="kk r">B</span><b>Back</b></div>
            <div className="spacer" />
            <div className="ctl" style={{ opacity: .6 }}><span>← → systems</span></div>
          </div>
        </div>
      )}

      {/* ── GAMES: cinematic wheel + coverflow ── */}
      {currentView === 'games' && (
        <div className="nw-shell">
          <div className="nw-top">
            <div className="nw-brand">
              <div className="nw-brand-mark">N</div>
              <div>
                <div className="nw-brand-name">NEOCAB</div>
                <div className="nw-brand-sub">Neon Wall · Cinema Mode</div>
              </div>
            </div>
            <div className="nw-collection-name">{collectionLabel}</div>
            <div className="nw-time">
              <span className="led" /><span>LIVE</span>
              <span style={{ opacity: .5 }}>·</span>
              <b>{time}</b>
            </div>
          </div>

          <div className="nw-cine">
            <div className="nw-cine-stage">
              {focused ? (
                <>
                  {/* Marquee lightbox */}
                  <div className="nw-cine-marquee" key={`mq-${focused.id}`}>
                    <div className="nw-cine-bulbs top">{bulbs}</div>
                    <div className="nw-marquee-text">{focused.title.toUpperCase()}</div>
                    <div className="nw-cine-bulbs bottom">{bulbs}</div>
                  </div>

                  {/* Cinema screen */}
                  <div className="nw-cine-screen" key={`sc-${focused.id}`}>
                    <div className="nw-cine-screen-sweep" />
                    {focused.video_path ? (
                      <video
                        ref={videoRef}
                        src={resolveAsset(focused.video_path)}
                        autoPlay loop muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : focused.image_path ? (
                      <img
                        src={resolveAsset(focused.image_path)}
                        alt={focused.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="nw-feat-screen-content">
                        <div className="big">{focused.title.toUpperCase()}</div>
                        {focused.developer && <div className="sub">{focused.developer.toUpperCase()}</div>}
                        <div className="copy">© {focused.year ?? '----'} · {selectedSystem?.display_name.toUpperCase()}</div>
                      </div>
                    )}
                    <div className="nw-feat-screen-scan" />
                  </div>

                  {/* Info row */}
                  <div className="nw-cine-info" key={`inf-${focused.id}`}>
                    <div className="nw-cine-info-main">
                      <div className="nw-cine-eyebrow">
                        <span className="dot" />
                        <span>{selectedSystem?.display_name.toUpperCase()} · {focused.year ?? '----'}</span>
                      </div>
                      <div className="nw-cine-title">{focused.title}</div>
                      {(focused.genre || focused.developer) && (
                        <div className="nw-cine-tag">
                          {[focused.genre, focused.developer].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="nw-cine-info-side">
                      <div className="nw-cine-pos">
                        <b>{String(focusedIndex + 1).padStart(3, '0')}</b>
                        {' '}/ {String(games.length).padStart(3, '0')}
                      </div>
                      <button className="nw-launch-btn" tabIndex={-1} disabled={loading}
                        onClick={() => !loading && onPlayGame(focused)}>
                        <span className="kbd">A</span>
                        <span>Launch</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="nw-cine-empty">
                  <div className="nw-feat-logo" style={{ fontSize: 72 }}>EMPTY</div>
                  <div className="nw-feat-sub">{selectedSystem?.display_name.toUpperCase()} · 0 TITLES</div>
                </div>
              )}
            </div>

            {/* Coverflow carousel */}
            {cvLen > 0 && (
              <div className="nw-cv-wrap">
                <div className="nw-cv-floor" />
                <div className="nw-cv">
                  <div className="nw-cv-track">
                    {cvTiles.map(({ d, g }) => {
                      if (!g) return null;
                      const [h, h2] = getSystemHue(selectedSystem?.name ?? '');
                      const absD = Math.abs(d);
                      return (
                        <div key={`${g.id}-${d}`}
                          className={`nw-cv-tile${d === 0 ? ' active' : ''}`}
                          style={{
                            transform: cvTransform(d),
                            opacity: d === 0 ? 1 : Math.max(0.12, 0.82 - (absD - 1) * 0.15),
                            filter: absD >= 4 ? `blur(${(absD - 3) * 0.9}px)` : 'none',
                            '--g-h': h, '--g-h2': h2,
                            zIndex: 100 - absD,
                          } as React.CSSProperties}
                          onClick={() => d !== 0 && setFocusedIndex(wrapIdx(focusedIndex + d))}>
                          <div className="nw-cv-tile-bg" />
                          <div className="nw-cv-tile-scan" />
                          <div className="nw-cv-tile-strip" />
                          <div className="nw-cv-tile-ic">{g.title.charAt(0)}</div>
                          {g.is_favorite === 1 && <div className="nw-cv-tile-fav">★</div>}
                          <div className="nw-cv-tile-name">{g.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button className="nw-cv-arrow l" onClick={() => setFocusedIndex((focusedIndex - 1 + cvLen) % cvLen)}>‹</button>
                <button className="nw-cv-arrow r" onClick={() => setFocusedIndex((focusedIndex + 1) % cvLen)}>›</button>
              </div>
            )}
          </div>

          <div className="nw-controls">
            <div className="ctl"><span className="kk g">A</span><b>Launch</b></div>
            <div className="ctl"><span className="kk r">B</span><b>Back</b></div>
            <div className="ctl"><span className="kk y">Y</span><b>Favorite</b></div>
            <div className="spacer" />
            <span style={{ opacity: .6 }}>← → games</span>
          </div>
        </div>
      )}
    </div>
  );
}
