import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getSystemHue } from '../../components/arcade/MediaShape';
import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { HomeShell } from '../shared/HomeShell';
import '../shared/home-shared.css';
import './neonwall.css';

function resolveAsset(path?: string) {
  if (!path) return undefined;
  try { return convertFileSrc(path); } catch { return path; }
}

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
}



export function NeonWallSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading,
  onSelectSystem, onPlayGame, onBack, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: SkinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const time = useClock();

  useEffect(() => {
    const root = document.querySelector('.theme-neonwall') as HTMLElement | null;
    if (!root) return;
    let h = 270, h2 = 340;
    if (currentView === 'systems' && systems[focusedIndex]) [h, h2] = getSystemHue(systems[focusedIndex].name);
    else if (currentView === 'games' && selectedSystem) [h, h2] = getSystemHue(selectedSystem.name);
    root.style.setProperty('--nw-h',  String(h));
    root.style.setProperty('--nw-h2', String(h2));
  }, [currentView, focusedIndex, systems, selectedSystem]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  const focused = currentView === 'games' ? games[focusedIndex] : undefined;
  const focSys  = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);

  // tile rows: slices of games around the focused index
  const topRow    = games.slice(Math.max(0, focusedIndex - 2), focusedIndex + 3);
  const bottomRow = games.slice(Math.max(0, focusedIndex - 1), focusedIndex + 4);

  const totals = {
    titles: systems.reduce((n, s) => n + (s.game_count ?? 0), 0),
    systems: systems.length,
    favorites: games.filter(g => g.is_favorite === 1).length,
  };

  const collectionLabel =
    currentView === 'menu'    ? 'MAIN MENU' :
    currentView === 'systems' ? (focSys?.display_name.toUpperCase() ?? 'SYSTEMS') :
    selectedSystem?.display_name.toUpperCase() ?? 'ARCADE';


  return (
    <div className="theme-neonwall">
      <div className="nw-bg">
        <div className="nw-bg-rays" />
        <div className="nw-bg-tex" />
      </div>

      {currentView === 'menu' && (
        <HomeShell
          className="nc-home"
          activeIndex={focusedIndex}
          onSelect={(id) => {
            if (id === 'play') onShowSystems();
            else if (id === 'scan') onScanROMs();
            else if (id === 'settings') onShowSettings();
            else if (id === 'operator') onShowOperator();
          }}
          totals={totals}
          themeName="NeonWall"
          themeTag="Neon Tiles · Cyberpunk · Grid"
        />
      )}

      {(currentView === 'systems' || currentView === 'games') && (
      <div className="nw-shell">

        {/* TOP */}
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
            <span className="led" />
            <span>LIVE</span>
            <span style={{ opacity: .5 }}>·</span>
            <b>{time}</b>
          </div>
        </div>

        {/* MAIN */}
        <div className="nw-main">
            <div className="nw-wall">

              {/* ── SYSTEMS ── */}
              {currentView === 'systems' && (
                <div className="nw-sys-view">
                  <div className="nw-sys-header">
                    <div className="nw-sys-title">{focSys?.display_name.toUpperCase() ?? '–'}</div>
                    <div className="nw-sys-count">{systems.length} LIBRARIES</div>
                    <button className="nw-sys-back" onClick={onBack} tabIndex={-1}>← VOLVER</button>
                  </div>
                  <div className="nw-sys-grid">
                    {systems.map((s, i) => {
                      const [h] = getSystemHue(s.name);
                      return (
                        <button key={s.id} className={`nw-sys-tile${i === focusedIndex ? ' active' : ''}`}
                          style={{ '--c-h': h } as React.CSSProperties}
                          onClick={() => onSelectSystem(s)} tabIndex={-1}>
                          <div className="nw-sys-tile-icon">{s.name.slice(0,3).toUpperCase()}</div>
                          <div className="nw-sys-tile-name">{s.display_name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* ── GAMES: tile rows + featured ── */}
            {currentView === 'games' && selectedSystem && (
              <>
                {/* Top tile row */}
                {topRow.length > 0 && (
                  <div className="nw-tile-row top">
                    {topRow.map(g => {
                      const [h] = getSystemHue(selectedSystem.name);
                      return (
                        <div key={g.id} className={`nw-tile${g.id === focused?.id ? ' active' : ''}`}
                          style={{ '--t-h': h } as React.CSSProperties}>
                          <div className="t">{g.title}</div>
                          <div className="s">{selectedSystem.name.toUpperCase()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Bottom tile row */}
                {bottomRow.length > 0 && (
                  <div className="nw-tile-row bottom">
                    {bottomRow.map(g => {
                      const [h] = getSystemHue(selectedSystem.name);
                      return (
                        <div key={g.id} className={`nw-tile${g.id === focused?.id ? ' active' : ''}`}
                          style={{ '--t-h': h } as React.CSSProperties}>
                          <div className="t">{g.title}</div>
                          <div className="s">{selectedSystem.name.toUpperCase()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Featured center */}
                {focused ? (
                  <div className="nw-featured" key={focused.id}>
                    <div className="nw-feat-text">
                      <div className="nw-feat-eyebrow">
                        <span className="dot" />
                        <span>NOW FEATURED · {selectedSystem.display_name.toUpperCase()}</span>
                        <span style={{ opacity: .4 }}>·</span>
                        <span>{focused.year ?? '----'}</span>
                      </div>
                      <div className="nw-feat-logo">{focused.title}</div>
                      {focused.developer && <div className="nw-feat-sub">{focused.developer.toUpperCase()}</div>}
                      <div className="nw-feat-meta">
                        <div className="nw-feat-meta-cell"><div className="k">AÑO</div><div className="v">{focused.year ?? '—'}</div></div>
                        <div className="nw-feat-meta-cell"><div className="k">GÉNERO</div><div className="v">{focused.genre ?? '—'}</div></div>
                        <div className="nw-feat-meta-cell"><div className="k">PLAYERS</div><div className="v">{focused.players ?? '—'}</div></div>
                        <div className="nw-feat-meta-cell"><div className="k">PARTIDAS</div><div className="v hi">{String(focused.play_count ?? 0).padStart(4,'0')}</div></div>
                      </div>
                      <button className="nw-launch-btn" tabIndex={-1} disabled={loading}
                        onClick={() => !loading && onPlayGame(focused)}>
                        <span className="kbd">A</span>
                        <span>Launch Game</span>
                      </button>
                    </div>

                    <div className="nw-feat-media-col">
                      <div className="nw-feat-marquee">
                        <div className="nw-marquee-text">{focused.title.toUpperCase()}</div>
                      </div>
                      <div className="nw-feat-screen">
                        {focused.video_path ? (
                          <video ref={videoRef} src={resolveAsset(focused.video_path)} autoPlay loop muted playsInline />
                        ) : focused.image_path ? (
                          <img src={resolveAsset(focused.image_path)} alt={focused.title} />
                        ) : (
                          <div className="nw-feat-screen-content">
                            <div className="big">{focused.title.toUpperCase()}</div>
                            {focused.developer && <div className="sub">{focused.developer.toUpperCase()}</div>}
                            <div className="copy">© {focused.year ?? '----'} · {selectedSystem.display_name.toUpperCase()}</div>
                          </div>
                        )}
                        <div className="nw-feat-screen-corner tl">CH 02</div>
                        <div className="nw-feat-screen-corner tr">● {focused.video_path ? 'CINEMA · 16:9' : 'STILL · 4:3'}</div>
                        <div className="nw-feat-screen-corner bl">{String(focusedIndex + 1).padStart(3,'0')} / {String(games.length).padStart(3,'0')}</div>
                        <div className="nw-feat-screen-scan" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="nw-feat-text" style={{ textAlign: 'center', padding: 60 }}>
                    <div className="nw-feat-eyebrow"><span className="dot" /><span>NO GAMES</span></div>
                    <div className="nw-feat-logo">EMPTY</div>
                    <div className="nw-feat-sub">{selectedSystem.display_name.toUpperCase()} · 0 TITLES</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="nw-floor" />
        </div>

        {/* COLLECTION / SYSTEM RAIL (games view) */}
        {currentView === 'games' && (
          <div className="nw-rail-wrap">
            <div className="nw-rail-head">
              <span>SISTEMAS</span>
              <div className="line" />
              <span>
                <b style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#fff', letterSpacing: '.06em', fontWeight: 400 }}>
                  {games.length}
                </b>
                {' '}titles in {selectedSystem?.display_name}
              </span>
            </div>
            <div className="nw-rail">
              {systems.map(s => {
                const [h] = getSystemHue(s.name);
                const isActive = s.id === selectedSystem?.id;
                return (
                  <div key={s.id} className={`nw-rail-card${isActive ? ' active' : ''}`}
                    style={{ '--c-h': h } as React.CSSProperties}
                    onClick={() => onSelectSystem(s)}>
                    <span className="ic">{s.name.slice(0,2).toUpperCase()}</span>
                    <span className="lbl">
                      <span className="name">{s.display_name.split(' ')[0]}</span>
                      <span className="ct">{isActive ? `${games.length} titles` : s.name}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="nw-controls">
          {currentView === 'games' ? (
            <>
              <div className="nw-ctl"><span className="kk g">A</span><b>Jugar</b></div>
              <div className="nw-ctl"><span className="kk r">B</span><b>Volver</b></div>
              <div className="nw-ctl"><span className="kk y">Y</span><b>Favorito</b></div>
              <div className="nw-ctl"><span className="kk b">X</span><b>Info</b></div>
              <div className="spacer" />
              <span style={{ opacity: .6 }}>← → juegos</span>
            </>
          ) : currentView === 'systems' ? (
            <>
              <div className="nw-ctl"><span className="kk g">A</span><b>Seleccionar</b></div>
              <div className="nw-ctl"><span className="kk r">B</span><b>Volver</b></div>
              <div className="spacer" />
            </>
          ) : (
            <>
              <div className="nw-ctl"><span className="kk g">A</span><b>Confirmar</b></div>
              <div className="nw-ctl"><span className="kk r">B</span><b>Salir</b></div>
              <div className="spacer" />
              {loading && <span style={{ opacity: .5 }}>CARGANDO...</span>}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
