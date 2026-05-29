import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { MediaShape, getSystemShape, getSystemHue } from '../../components/arcade/MediaShape';
import { ARCADE_MENU } from '../shared/menu';
import type { SkinProps } from '../hyperrush/HyperRushSkin';
import './batocera.css';

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

export function BatoceraSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading, scanProgress,
  onSelectSystem, onPlayGame, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: SkinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const time = useClock();

  useEffect(() => {
    const root = document.querySelector('.theme-batocera') as HTMLElement | null;
    if (!root) return;
    let h = 220, h2 = 280;
    if (currentView === 'systems' && systems[focusedIndex]) [h, h2] = getSystemHue(systems[focusedIndex].name);
    else if (currentView === 'games' && selectedSystem) [h, h2] = getSystemHue(selectedSystem.name);
    root.style.setProperty('--bat-h',  String(h));
    root.style.setProperty('--bat-h2', String(h2));
  }, [currentView, focusedIndex, systems, selectedSystem]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const rowH = 58;
      listRef.current.scrollTop = Math.max(0, (focusedIndex - 4) * rowH);
    }
  }, [focusedIndex]);

  const focused = currentView === 'games' ? games[focusedIndex] : undefined;
  const focSys  = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);

  const section =
    currentView === 'menu'    ? 'MAIN MENU' :
    currentView === 'systems' ? `SYSTEMS · ${systems.length}` :
    selectedSystem?.display_name.toUpperCase() ?? 'LIBRARY';

  const sectionDetail =
    currentView === 'games' ? `${games.length} TITLES` : undefined;

  return (
    <div className="theme-batocera">
      <div className="bat-bg">
        <div className="bat-bg-art" />
        <div className="bat-bg-tex" />
        <div className="bat-bg-glow" />
      </div>

      <div className="bat-shell">
        {/* Header */}
        <div className="bat-header">
          <div className="bat-header-left">
            <div className="bat-brand">
              <span className="bat-brand-dot" />
              <span>NEOCAB</span>
            </div>
            <div className="bat-section">
              <b>{section}</b>
              {sectionDetail && <><span style={{ opacity: .4 }}>·</span><span>{sectionDetail}</span></>}
            </div>
          </div>
          <div className="bat-header-right">
            <div className="bat-pill"><span className="dot" /><span>ONLINE</span></div>
            <div className="bat-pill accent">CABINET MODE</div>
            <div className="bat-pill"><span>{time}</span></div>
          </div>
        </div>

        {/* ── MENU ── */}
        {currentView === 'menu' && (
          <div className="bat-home">
            <div className="bat-home-left">
              <div className="bat-home-eyebrow"><span className="dot" /><span>SYSTEM ONLINE · LAUNCHER READY</span></div>
              <div className="bat-home-title">NEO<span className="accent">CAB</span></div>
              <div className="bat-home-sub">Your arcade cabinet, dressed up clean. Pick a system or jump straight to your pinned titles.</div>
              <div className="bat-home-stats">
                <div className="bat-home-stat"><div className="k">Titles</div><div className="v">{games.length}</div></div>
                <div className="bat-home-stat"><div className="k">Systems</div><div className="v">{systems.length}</div></div>
                <div className="bat-home-stat"><div className="k">Favorites</div><div className="v">{games.filter(g => g.is_favorite === 1).length}</div></div>
                <div className="bat-home-stat"><div className="k">Sessions</div><div className="v">—</div></div>
              </div>
              <div className="bat-home-recent">
                <div className="bat-home-recent-head"><span>RECENT</span><div className="line" /><span>last played</span></div>
                {games.filter(g => (g.play_count ?? 0) > 0).slice(0, 3).map(g => (
                  <div key={g.id} className="bat-home-recent-row">
                    <span className="ttl">{g.title}</span>
                    <span className="sys">{selectedSystem?.name ?? '—'}</span>
                    <span className="when">{g.play_count ?? 0} plays</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bat-home-right">
              <div className="bat-home-menu-head"><span>MAIN MENU</span><div className="line" /></div>
              <div className="bat-home-menu">
                {ARCADE_MENU.map((item, i) => {
                  const menuActions: Record<string, () => void> = {
                    play: onShowSystems,
                    scan: onScanROMs,
                    settings: onShowSettings,
                    operator: onShowOperator,
                  };
                  return (
                    <button key={item.id} className={`bat-menu-item${i === focusedIndex ? ' active' : ''}`} onClick={() => menuActions[item.id]?.()} tabIndex={-1}>
                      <span className="mi-num">{String(i+1).padStart(2,'0')}</span>
                      <span className="mi-icon">{item.icon}</span>
                      <span className="mi-body">
                        <span className="mi-label">{item.label}</span>
                        <span className="mi-tag">{item.sub}</span>
                      </span>
                      {i === focusedIndex && <span className="mi-arrow">▶</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEMS carousel ── */}
        {currentView === 'systems' && (
          <div className="bat-systems">
            <div className="bat-systems-hero">
              <div className="bat-systems-eyebrow">SELECT A LIBRARY</div>
              <div className="bat-systems-name">{focSys?.display_name.toUpperCase() ?? '—'}</div>
              <div className="bat-systems-tag">{focSys?.name.toUpperCase() ?? ''}</div>
              <div className="bat-systems-stats">
                <div className="stat"><span className="v">{systems.length}</span><span>systems online</span></div>
                <div className="stat"><span className="v">{games.length}</span><span>titles loaded</span></div>
              </div>

              <div className="bat-carousel">
                <div
                  className="bat-carousel-track"
                  style={{ transform: `translate(calc(-${focusedIndex * 260}px - 130px), -50%)` }}
                >
                  {systems.map((s, i) => {
                    const d = i - focusedIndex;
                    const abs = Math.abs(d);
                    const [h] = getSystemHue(s.name);
                    const scale = d === 0 ? 1.2 : abs === 1 ? .78 : abs === 2 ? .58 : .42;
                    const opacity = abs === 0 ? 1 : abs === 1 ? .8 : abs === 2 ? .35 : .12;
                    const blur = abs === 0 ? 0 : abs === 1 ? .4 : abs === 2 ? 1.6 : 3;
                    return (
                      <button
                        key={s.id}
                        className={`bat-sys-card${d === 0 ? ' active' : ''}`}
                        style={{
                          transform: `scale(${scale}) rotateY(${d * -14}deg)`,
                          opacity, filter: `blur(${blur}px)`, zIndex: 100 - abs,
                          '--card-h': h,
                        } as React.CSSProperties}
                        onClick={() => onSelectSystem(s)} tabIndex={-1}>
                        <div className="sc-glow" />
                        <div className="sc-shape">
                          <MediaShape shape={getSystemShape(s.name)} hue={h} short={s.name.slice(0,4).toUpperCase()} />
                        </div>
                        <div className="sc-foot">
                          <div className="sc-name">{s.display_name}</div>
                          <div className="sc-tag">{s.name.toUpperCase()}</div>
                          <div className="sc-count"><b>{s.game_count ?? 0}</b> titles</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bat-system-rail">
              {systems.slice(0, 12).map((s, i) => {
                const [h] = getSystemHue(s.name);
                return (
                  <button key={s.id} className={`bat-rail-dot${i === focusedIndex ? ' active' : ''}`}
                    style={{ '--bat-accent': `oklch(72% 0.18 ${h})` } as React.CSSProperties}
                    onClick={() => onSelectSystem(s)} tabIndex={-1}>
                    <span className="lbl">{s.name.slice(0,4).toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GAMES ── */}
        {currentView === 'games' && selectedSystem && (
          <div className="bat-games">
            {/* Left: list */}
            <div className="bat-list-col">
              <div className="bat-filters">
                <div className="bat-filter active">Todos <span className="ct">{games.length}</span></div>
                <div className="bat-filter">Favoritos <span className="ct">{games.filter(g => g.is_favorite === 1).length}</span></div>
              </div>
              <div className="bat-game-list" ref={listRef}>
                {games.map((game, i) => (
                  <button key={game.id}
                    className={`bat-row${i === focusedIndex ? ' active' : ''}${game.is_favorite === 1 ? ' is-fav' : ''}`}
                    tabIndex={-1} disabled={loading}
                    onClick={() => !loading && onPlayGame(game)}>
                    <span className="num">{String(i+1).padStart(3,'0')}</span>
                    <span className="star" />
                    <span className="ttl">{game.title}</span>
                    <span className="pc"><b>{game.play_count ?? 0}</b></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: marquee + preview */}
            <div className="bat-preview-col">
              <div className="bat-marquee">
                <div className="bat-marquee-text">{focused?.title.toUpperCase() ?? selectedSystem.display_name.toUpperCase()}</div>
              </div>
              <div className="bat-preview">
                <div className="bat-screen">
                  <div className="bat-screen-bg" />
                  {focused?.video_path ? (
                    <video ref={videoRef} src={resolveAsset(focused.video_path)} autoPlay loop muted playsInline />
                  ) : focused?.image_path ? (
                    <img src={resolveAsset(focused.image_path)} alt={focused?.title} />
                  ) : focused ? (
                    <div className="bat-screen-art">
                      <div className="big">{focused.title.toUpperCase()}</div>
                      {focused.developer && <div className="sub">{focused.developer.toUpperCase()}</div>}
                    </div>
                  ) : (
                    <div className="bat-screen-fallback">
                      <div className="glyph">NO MEDIA</div>
                      <div className="ttl">SIN JUEGO</div>
                      <div className="sub">selecciona un título</div>
                    </div>
                  )}
                  <div className="bat-screen-corner"><span className="dot" /><span>{focused?.video_path ? 'VIDEO' : 'SCREEN'}</span></div>
                  <div className="bat-screen-scan" />
                </div>
                {focused && (
                  <div className="bat-meta">
                    <div className="bat-meta-cell"><div className="k">SISTEMA</div><div className="v">{selectedSystem.display_name}</div></div>
                    <div className="bat-meta-cell"><div className="k">AÑO</div><div className="v">{focused.year ?? '—'}</div></div>
                    <div className="bat-meta-cell"><div className="k">MAKER</div><div className="v">{focused.developer ?? '—'}</div></div>
                    <div className="bat-meta-cell"><div className="k">GÉNERO</div><div className="v">{focused.genre ?? '—'}</div></div>
                    <div className="bat-meta-cell"><div className="k">PLAYERS</div><div className="v">{focused.players ?? '—'}</div></div>
                    <div className="bat-meta-cell"><div className="k">PARTIDAS</div><div className="v hi">{String(focused.play_count ?? 0).padStart(4,'0')}</div></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bat-controls">
          {currentView === 'games' ? (
            <>
              <div className="bat-ctl"><span className="btn g">A</span><span className="lbl"><b>Jugar</b><span>start game</span></span></div>
              <div className="bat-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>main menu</span></span></div>
              <div className="bat-ctl"><span className="btn y">Y</span><span className="lbl"><b>Favorito</b><span>pin</span></span></div>
              <div className="bat-ctl"><span className="btn b">X</span><span className="lbl"><b>Info</b><span>detalles</span></span></div>
              <div className="spacer" />
              {loading && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.28em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase' }}>{scanProgress}</span>}
            </>
          ) : currentView === 'systems' ? (
            <>
              <div className="bat-ctl"><span className="btn g">A</span><span className="lbl"><b>Seleccionar</b><span>ver juegos</span></span></div>
              <div className="bat-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>menú</span></span></div>
              <div className="spacer" />
            </>
          ) : (
            <>
              <div className="bat-ctl"><span className="btn g">A</span><span className="lbl"><b>Confirmar</b><span>seleccionar</span></span></div>
              <div className="bat-ctl"><span className="btn r">B</span><span className="lbl"><b>Salir</b><span>apagar</span></span></div>
              <div className="spacer" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
