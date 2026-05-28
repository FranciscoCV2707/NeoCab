import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getSystemHue } from '../../components/arcade/MediaShape';
import type { SkinProps } from '../hyperrush/HyperRushSkin';
import './flux.css';

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

function useDebug() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'd' || e.key === 'D') setShow(v => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return show;
}

const MENU_ITEMS = [
  { id: 'play',     label: 'JUGAR',    tag: 'selecciona sistema', icon: '▶' },
  { id: 'scan',     label: 'ESCANEAR', tag: 'buscar ROMs',        icon: '⟳' },
  { id: 'settings', label: 'AJUSTES',  tag: 'cabinet & tema',     icon: '⚙' },
  { id: 'operator', label: 'OPERADOR', tag: 'panel de control',   icon: '⚐' },
];

export function FluxSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading,
  onSelectSystem, onPlayGame, onBack, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: SkinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const time = useClock();
  const showDebug = useDebug();

  useEffect(() => {
    const root = document.querySelector('.theme-flux') as HTMLElement | null;
    if (!root) return;
    let h = 290, h2 = 50;
    if (currentView === 'systems' && systems[focusedIndex]) [h, h2] = getSystemHue(systems[focusedIndex].name);
    else if (currentView === 'games' && selectedSystem) [h, h2] = getSystemHue(selectedSystem.name);
    root.style.setProperty('--fx-h',  String(h));
    root.style.setProperty('--fx-h2', String(h2));
  }, [currentView, focusedIndex, systems, selectedSystem]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  const focused = currentView === 'games' ? games[focusedIndex] : undefined;
  const focSys  = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);

  const visible = (() => {
    if (!games.length) return [];
    return [-1, 0, 1, 2, 3].map(d => {
      const i = focusedIndex + d;
      if (i < 0 || i >= games.length) return null;
      return { game: games[i], i, depth: Math.abs(d) };
    }).filter(Boolean) as { game: typeof games[number]; i: number; depth: number }[];
  })();

  const miniGames = games.slice(Math.max(0, focusedIndex - 1), focusedIndex + 4);

  return (
    <div className="theme-flux">
      <div className="fx-bg"><div className="fx-bg-tex" /></div>

      {/* ── HOME overlay ── */}
      {currentView === 'menu' && (
        <div className="fx-overlay-view">
          <div className="fx-home-logo">NEOCAB</div>
          <div className="fx-home-menu">
            {MENU_ITEMS.map((item, i) => {
              const action = [onShowSystems, onScanROMs, onShowSettings, onShowOperator][i];
              return (
                <button key={item.id} className={`fx-home-btn${i === focusedIndex ? ' active' : ''}`} onClick={action} tabIndex={-1}>
                  <span className="ic">{item.icon}</span>
                  <span className="nm">{item.label}</span>
                  <span className="tg">{item.tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SYSTEMS overlay ── */}
      {currentView === 'systems' && (
        <div className="fx-sys-screen">
          <div className="fx-overlay-view">
            <div className="fx-sys-head">
              <div>
                <div className="fx-logo-eyebrow"><span className="sq" /><span>SELECT SYSTEM</span></div>
                <div className="fx-sys-title" style={{fontSize: 84}}>{focSys?.display_name?.toUpperCase() ?? '—'}</div>
                <div className="fx-sys-sub">{focSys?.name ?? ''}</div>
              </div>
              <button className="fx-sys-back" onClick={onBack} tabIndex={-1}>← VOLVER</button>
            </div>
          </div>
          <div className="fx-sys-carousel">
            <div className="fx-sys-track" style={{ transform: `translate(calc(50% - ${focusedIndex * 320 + 160}px), -50%)` }}>
              {systems.map((sys, i) => {
                const d = i - focusedIndex;
                const abs = Math.abs(d);
                return (
                  <button key={sys.id}
                    className={`fx-sys-card${d === 0 ? ' active' : ''}`}
                    style={{
                      '--c-h': getSystemHue(sys.name)[0],
                      transform: `rotate(${d * -3}deg) scale(${abs === 0 ? 1 : abs === 1 ? .85 : .68})`,
                      opacity: abs === 0 ? 1 : abs === 1 ? .75 : .35,
                      filter: `blur(${abs === 0 ? 0 : abs * .6}px)`,
                      zIndex: 100 - abs,
                    } as React.CSSProperties}
                    onClick={() => onSelectSystem(sys)} tabIndex={-1}>
                    <div className="fx-sys-card-bg" />
                    <div className="fx-sys-card-short">{sys.name.slice(0,4).toUpperCase()}</div>
                    <div className="fx-sys-card-name">{sys.display_name}</div>
                    <div className="fx-sys-card-tag">{sys.name}</div>
                    <div className="fx-sys-card-count"><b>{games.length}</b> titles</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── GAMES layout ── */}
      {currentView === 'games' && selectedSystem && (
        <div className="fx-shell">
          {/* Top-left: big logo */}
          <div className="fx-logo-wrap" key={focused?.id ?? 'none'}>
            <div className="fx-logo-eyebrow">
              <span className="sq" />
              <span>{selectedSystem.name.toUpperCase()} · {focused?.year ?? '----'}</span>
              <span style={{ opacity: .4 }}>·</span>
              <span>{focused?.developer ?? ''}</span>
            </div>
            <div className="fx-logo-big">{focused?.title ?? '—'}</div>
            {focused?.developer && <div className="fx-logo-sub">{focused.developer.toUpperCase()}</div>}
            {focused?.genre && <div className="fx-logo-tagline">{focused.genre}</div>}
          </div>

          {/* Top center: attract clock */}
          <div className="fx-attract-clock">
            <span className="dot" />
            <span>{selectedSystem.display_name.toUpperCase()}</span>
            <b>{time}</b>
          </div>

          {/* Top right: filter indicator */}
          <div className="fx-filter-ind">
            <div className="lbl">Current System</div>
            <div className="v">{selectedSystem.name.toUpperCase()}</div>
            <div className="row">
              <span>GENRE · {focused?.genre ?? '—'}</span>
              <span style={{ opacity: .4 }}>·</span>
              <span>{focused?.year ?? '----'}</span>
            </div>
          </div>

          {/* Mini strip above preview */}
          <div className="fx-mini-strip">
            {miniGames.map((g) => {
              const isActive = g.id === focused?.id;
              return (
                <div key={g.id} className={`fx-mini${isActive ? ' active' : ''}`}>
                  {g.image_path && <img src={resolveAsset(g.image_path)} alt="" />}
                  <span className="tag">{isActive ? 'PLAYING' : g.title.slice(0,8)}</span>
                </div>
              );
            })}
          </div>

          {/* Tilted preview center */}
          <div className="fx-preview-wrap">
            <div className="fx-preview">
              {focused?.video_path ? (
                <video ref={videoRef} src={resolveAsset(focused.video_path)} autoPlay loop muted playsInline />
              ) : focused?.image_path ? (
                <img src={resolveAsset(focused.image_path)} alt={focused?.title} />
              ) : focused ? (
                <div className="fx-preview-content">
                  <div className="big">{focused.title.toUpperCase()}</div>
                  {focused.developer && <div className="sub">{focused.developer.toUpperCase()}</div>}
                  <div className="copy">© {focused.year ?? '----'} · {selectedSystem.display_name.toUpperCase()}</div>
                </div>
              ) : (
                <div className="fx-preview-fallback">
                  <div className="glyph">◇</div>
                  <div className="ttl">NO GAME</div>
                  <div className="sub">selecciona un título</div>
                </div>
              )}
              <div className="fx-preview-corner tl">CH 02</div>
              <div className="fx-preview-corner tr">● {focused?.video_path ? 'VIDEO' : 'SCREEN'}</div>
              <div className="fx-preview-corner bl">RGB · 320×240</div>
              <div className="fx-preview-corner br">{String(focusedIndex + 1).padStart(3,'0')} / {String(games.length).padStart(3,'0')}</div>
              <div className="fx-preview-scan" />
            </div>
          </div>

          {/* Perspective list right */}
          <div className="fx-list-col">
            <div className="fx-list-head">
              <span>BROWSE</span>
              <span>
                <span className="v">{games.length ? focusedIndex + 1 : 0}</span>
                <span style={{ opacity: .4 }}> / </span>
                <span className="v" style={{ color: 'rgba(255,255,255,.5)' }}>{games.length}</span>
              </span>
            </div>
            <div className="fx-list">
              {visible.map(({ game, i, depth }) => (
                <button key={game.id}
                  className={`fx-list-row d${depth}${game.is_favorite === 1 ? ' fav' : ''}`}
                  tabIndex={-1} disabled={loading}
                  onClick={() => !loading && onPlayGame(game)}>
                  <span className="num">{String(i + 1).padStart(2,'0')}</span>
                  <span className="star" />
                  <span className="ttl">{game.title}</span>
                  <span className="yr">{game.year ?? ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Floating meta panel bottom-right */}
          {focused && (
            <div className="fx-meta-panel" key={focused.id + 'meta'}>
              <div className="fx-meta-head">
                <span className="dot" />
                <span>GAME INFO · NOW PLAYING</span>
              </div>
              <div className="fx-meta-grid">
                <div className="fx-meta-cell"><div className="k">Sistema</div><div className="v">{selectedSystem.display_name}</div></div>
                <div className="fx-meta-cell"><div className="k">Año</div><div className="v">{focused.year ?? '—'}</div></div>
                <div className="fx-meta-cell"><div className="k">Maker</div><div className="v">{focused.developer ?? '—'}</div></div>
                <div className="fx-meta-cell"><div className="k">Género</div><div className="v">{focused.genre ?? '—'}</div></div>
                <div className="fx-meta-cell"><div className="k">Players</div><div className="v">{focused.players ?? '—'}</div></div>
                <div className="fx-meta-cell"><div className="k">Partidas</div><div className="v hi">{String(focused.play_count ?? 0).padStart(4,'0')}</div></div>
              </div>
            </div>
          )}

          {/* Debug overlay */}
          {showDebug && currentView === 'games' && (
            <div className="fx-debug">
              <div className="ttl"><span>THEME DEBUG</span><span>[D] hide</span></div>
              <div className="row"><span className="k">Layout</span><span className="v">flux/diagonal</span></div>
              <div className="row"><span className="k">System</span><span className="v">{selectedSystem?.id ?? '—'}</span></div>
              <div className="row"><span className="k">Filter</span><span className="v">{selectedSystem?.name ?? '—'}</span></div>
              <div className="row"><span className="k">Games</span><span className="v">{games.length}</span></div>
              <div className="row"><span className="k">Resolution</span><span className="v">1920 × 1080</span></div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="fx-controls">
        {currentView === 'games' ? (
          <>
            <div className="fx-ctl"><span className="btn g">A</span><span className="lbl"><b>Jugar</b><span>start game</span></span></div>
            <div className="fx-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>main menu</span></span></div>
            <div className="fx-ctl"><span className="btn y">Y</span><span className="lbl"><b>Favorito</b><span>pin</span></span></div>
            <div className="fx-ctl"><span className="btn b">X</span><span className="lbl"><b>Info</b><span>detalles</span></span></div>
            <div className="spacer" />
            <div className="fx-ctl" style={{ opacity: .55 }}><span>↑ ↓ games · ← → systems</span></div>
          </>
        ) : currentView === 'systems' ? (
          <>
            <div className="fx-ctl"><span className="btn g">A</span><span className="lbl"><b>Seleccionar</b><span>ver juegos</span></span></div>
            <div className="fx-ctl"><span className="btn r">B</span><span className="lbl"><b>Volver</b><span>menú</span></span></div>
            <div className="spacer" />
          </>
        ) : (
          <>
            <div className="fx-ctl"><span className="btn g">A</span><span className="lbl"><b>Confirmar</b><span>seleccionar</span></span></div>
            <div className="fx-ctl"><span className="btn r">B</span><span className="lbl"><b>Salir</b><span>apagar</span></span></div>
            <div className="spacer" />
            {loading && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.28em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase' }}>CARGANDO...</span>}
          </>
        )}
      </div>
    </div>
  );
}
