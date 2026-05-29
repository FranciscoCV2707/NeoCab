import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { SkinProps } from '../hyperrush/HyperRushSkin';
import { MediaShape, getSystemShape, getSystemHue } from '../../components/arcade/MediaShape';
import { ARCADE_MENU } from '../shared/menu';
import './operator.css';

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
  const pad = (n: number) => String(n).padStart(2,'0');
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}

const FILTERS = [
  { id: 'all',   label: 'All',       key: 'A' },
  { id: 'favs',  label: 'Favorites', key: 'F' },
  { id: 'noplay',label: 'Not Played',key: 'N' },
];

const VIEWS = [
  { id: 'list',    label: 'List',          key: '1' },
  { id: 'preview', label: 'List + Preview',key: '2' },
  { id: 'grid',    label: 'Grid',          key: '3' },
];

export function OperatorSkin({
  currentView, systems, games, focusedIndex, selectedSystem,
  loading, scanProgress,
  onSelectSystem, onPlayGame, onBack, onShowSystems, onShowOperator, onShowSettings, onScanROMs,
}: SkinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const time = useClock();

  const [phosphor, setPhosphor] = useState<'green'|'amber'|'cyan'>('green');
  const [filter,   setFilter]   = useState('all');
  const [viewMode, setViewMode] = useState('preview');

  useEffect(() => {
    if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); }
  }, [focusedIndex]);

  // Auto-scroll list to keep focused item visible
  useEffect(() => {
    if (listRef.current) {
      const rowH = 34;
      listRef.current.scrollTop = Math.max(0, (focusedIndex - 6) * rowH);
    }
  }, [focusedIndex]);

  const focused = currentView === 'games' ? games[focusedIndex] : undefined;
  const focSys  = currentView === 'systems' ? systems[focusedIndex] : (selectedSystem ?? undefined);

  const filteredGames = (() => {
    if (currentView !== 'games') return games;
    if (filter === 'favs')  return games.filter(g => g.is_favorite === 1);
    if (filter === 'noplay') return games.filter(g => (g.play_count ?? 0) === 0);
    return games;
  })();

  const listItems = (() => {
    if (currentView === 'menu')    return ARCADE_MENU.map((m) => ({ id: m.id, title: m.label, sub: m.sub, plays: '', genre: '', sys: '' }));
    if (currentView === 'systems') return systems.map(s => ({ id: s.id, title: s.display_name, sub: s.name, plays: '', genre: '', sys: '' }));
    return filteredGames.map(g => ({ id: String(g.id), title: g.title, sub: g.developer ?? '', plays: String(g.play_count ?? 0), genre: g.genre ?? '', sys: selectedSystem?.name.toUpperCase() ?? '' }));
  })();

  const topbarSysName =
    currentView === 'systems' ? (focSys?.name.toUpperCase() ?? '—') :
    currentView === 'games'   ? (selectedSystem?.name.toUpperCase() ?? '—') :
    'MAIN MENU';

  return (
    <div className={`theme-operator phosphor-${phosphor}`}>
      <div className="op-bezel" />
      <div className="op-glow-layer" />

      {/* HOME - terminal boot style */}
      {currentView === 'menu' && (
        <div className="op-home">
          <div className="op-home-banner">
            <div className="op-home-ascii">{`
  ##    ## ########  #######  ######   ######  ########
  ###   ## ##       ##     ## ##    ## ##    ## ##
  #### ##  ##       ##     ## ##       ##    ## ##
  ## ## ## ######   ##     ## ##       ########  ######
  ##  #### ##       ##     ## ##       ##   ##   ##
  ##   ### ##       ##     ## ##    ## ##    ##  ##
  ##    ## ########  #######  ######   ##    ## ########
            `.trimEnd()}</div>
            <div className="op-home-brand">NEOCAB <span className="build">v2.2 · ADV-OP TERMINAL</span></div>
            <div className="op-home-status">SYSTEM <b>ONLINE</b> · <b>{systems.length}</b> SYSTEMS · <b>{games.length}</b> ROMS INDEXED · {time}</div>
          </div>
          <div className="op-home-grid">
            <div className="op-home-pane">
              <div className="op-pane-head">MAIN MENU<span className="right">SELECT &amp; PRESS [ENTER]</span></div>
              <div className="op-home-menu">
                {(() => {
                  const menuActions: Record<string, () => void> = {
                    play: onShowSystems,
                    scan: onScanROMs,
                    settings: onShowSettings,
                    operator: onShowOperator,
                  };
                  return ARCADE_MENU.map((item, i) => (
                    <div key={item.id} className={`op-menu-row${i === focusedIndex ? ' active' : ''}`}
                      onClick={() => menuActions[item.id]?.()}>
                      <span className="key">[{i+1}]</span>
                      <span className="ic">{item.icon}</span>
                      <span className="lbl">{item.label}</span>
                      <span className="tag">{item.sub}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="op-home-side">
              <div className="op-stats-pane">
                <div className="op-pane-head" style={{ padding: '0 0 6px', border: 'none', marginBottom: 6 }}>SESSION STATS</div>
                <div className="op-stats-row"><span className="k">Total titles</span><span className="v">{games.length}</span></div>
                <div className="op-stats-row"><span className="k">Systems online</span><span className="v">{systems.length}</span></div>
                <div className="op-stats-row"><span className="k">Favorites</span><span className="v">{games.filter(g => g.is_favorite === 1).length}</span></div>
              </div>
              <div className="op-recent-pane">
                <div className="op-pane-head">RECENT LAUNCHES<span className="right">last played</span></div>
                <div className="op-recent-list">
                  {games.filter(g => (g.play_count ?? 0) > 0).slice(0, 5).map((g, i) => (
                    <div key={g.id} className="op-recent-row">
                      <span className="num">{String(i+1).padStart(2,'0')}</span>
                      <span className="ttl">{g.title}</span>
                      <span className="when">{g.play_count ?? 0} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="op-home-log">
            <div><b>&gt;</b> system boot ok</div>
            <div><b>&gt;</b> roms.idx loaded · {games.length} entries indexed</div>
            <div><b>&gt;</b> crt phosphor warm · scanline integrity ok</div>
            <div><b>&gt;</b> awaiting input <span className="warn">_</span></div>
          </div>
        </div>
      )}

      {/* SYSTEMS - terminal carousel */}
      {currentView === 'systems' && (
        <div className="op-systems-screen">
          <div className="op-sys-head">
            <span>SELECT SYSTEM <span style={{ opacity: .5, marginLeft: 8 }}>· {String(focusedIndex + 1).padStart(2,'0')}/{String(systems.length).padStart(2,'0')}</span></span>
            <span className="right">USE [◄] [►] · ENTER TO OPEN</span>
          </div>
          <div className="op-sys-detail">
            <div className="op-sys-detail-cell"><div className="k">System</div><div className="v hi">{focSys?.name.toUpperCase() ?? '—'}</div></div>
            <div className="op-sys-detail-cell"><div className="k">Type</div><div className="v">{focSys?.name ?? '—'}</div></div>
            <div className="op-sys-detail-cell"><div className="k">Titles</div><div className="v hi">{games.length}</div></div>
          </div>
          <div className="op-sys-carousel">
            <div className="op-sys-track" style={{ transform: `translate(calc(-${focusedIndex * 240}px - 110px), -50%)` }}>
              {systems.map((s, i) => {
                const d = i - focusedIndex;
                const abs = Math.abs(d);
                const scale = d === 0 ? 1.2 : abs === 1 ? .82 : abs === 2 ? .62 : .42;
                const opacity = abs === 0 ? 1 : abs === 1 ? .65 : abs === 2 ? .25 : .08;
                const blur = abs === 0 ? 0 : abs === 1 ? .35 : abs === 2 ? 1.2 : 2.2;
                const [h] = getSystemHue(s.name);
                return (
                  <div key={s.id}
                    className={`op-sys-card${d === 0 ? ' active' : ''}`}
                    style={{ transform: `scale(${scale}) rotateY(${d * -15}deg)`, opacity, filter: `blur(${blur}px)`, zIndex: 100 - abs, '--c-h': h } as React.CSSProperties}
                    onClick={() => onSelectSystem(s)}>
                    <div className="op-sys-card-head">
                      <span className="short">{s.name.slice(0, 4).toUpperCase()}</span>
                      <span className="id">{i + 1}.sys</span>
                    </div>
                    <div className="op-sys-card-art">
                      <MediaShape shape={getSystemShape(s.name)} hue={h} short={s.name.slice(0,4).toUpperCase()} />
                    </div>
                    <div className="op-sys-card-name">{s.display_name}</div>
                    <div className="op-sys-card-tag">{s.name}</div>
                    <div className="op-sys-card-count">{games.length} ROMS</div>
                  </div>
                );
              })}
            </div>
            <div className="op-sys-pointer" />
          </div>
          <div className="op-sys-rail">
            {systems.map((s, i) => (
              <div key={s.id}
                className={`op-sys-rail-cell${i === focusedIndex ? ' active' : ''}`}
                onClick={() => onSelectSystem(s)}>
                <b>{String(i+1).padStart(2,'0')}</b>{s.name.slice(0, 4).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAMES - standard shell */}
      {(currentView === 'games') && (
      <div className="op-shell">
        {/* Top status bar */}
        <div className="op-topbar">
          <div className="seg"><b>ADV-OP</b><span className="sep">·</span>v2.2</div>
          <div className="seg"><span className="sep">│</span>SYS: <b>{topbarSysName}</b></div>
          <div className="seg"><span className="sep">│</span>ROMS: <b>{games.length}</b></div>
          <div className="seg"><span className="sep">│</span>VIEW: <b>{currentView.toUpperCase()}</b></div>
          <div className="seg" style={{ marginLeft: 'auto' }}>{time}<span className="blink" /></div>
        </div>

        {/* Filter tabs */}
        <div className="op-filterbar">
          {FILTERS.map(f => (
            <div key={f.id} className={`op-filter-tab${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}>
              <span className="key">{f.key}</span>
              <span>{f.label}</span>
              {f.id === 'all'  && <span className="ct">{games.length}</span>}
              {f.id === 'favs' && <span className="ct">{games.filter(g => g.is_favorite === 1).length}</span>}
            </div>
          ))}
          <div className="op-filter-tab" style={{ marginLeft: 'auto' }} onClick={onBack}>
            <span className="key">B</span>
            <span>← BACK</span>
          </div>
        </div>

        {/* Main two-pane */}
        <div className="op-main">
          {/* Left: list */}
          <div className="op-list-pane">
            <div className="op-pane-head">
              <span>{`${selectedSystem?.name.toUpperCase()} · ${filteredGames.length} ROMS`}</span>
              <span className="right">line {focusedIndex + 1} of {filteredGames.length}</span>
            </div>
            <div className="op-list-head">
              <span>#</span><span>★</span><span>Title</span><span>Developer</span><span>Genre</span><span style={{ textAlign: 'right' }}>Plays</span>
            </div>
            <div className="op-list" ref={listRef}>
              {filteredGames.map((g, i) => (
                <div key={g.id} className={`op-row${i === focusedIndex ? ' active' : ''}`}
                  onClick={() => !loading && onPlayGame(g)}>
                  <span className="num">{String(i+1).padStart(3,'0')}</span>
                  <span className="star">{g.is_favorite === 1 ? '★' : ' '}</span>
                  <span className="ttl">{g.title}</span>
                  <span className="sys">{g.developer ?? '—'}</span>
                  <span className="genre">{g.genre ?? '—'}</span>
                  <span className="plays">{g.play_count ?? 0}</span>
                </div>
              ))}
              {filteredGames.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--op-warn)', fontSize: 22, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                  ⚠ Empty — relax filter
                </div>
              )}
            </div>
            <div className="op-list-foot">
              <span>showing <b>{listItems.length}</b> entries</span>
              {loading && <span style={{ color: 'var(--op-warn)' }}>{scanProgress}</span>}
            </div>
          </div>

          {/* Right: marquee + snapshot + technical */}
          <div className="op-right-pane">
            {/* Marquee */}
            <div className="op-marquee-pane">
              {focused ? (
                <div className="op-marquee-text">{focused.title.toUpperCase()}</div>
              ) : (
                <div style={{ color: 'var(--op-fg-dim)', letterSpacing: '.18em', textTransform: 'uppercase' }}>
                  — NEOCAB OPERATOR —
                </div>
              )}
            </div>

            {/* Snapshot */}
            <div className="op-snapshot-pane">
              <div className="op-pane-head">
                <span>SNAPSHOT · {focused ? (focused.video_path ? 'VIDEO' : focused.image_path ? 'SCREEN' : 'MISSING') : '—'}</span>
                <span className="right">{focused?.title?.slice(0,20) ?? focSys?.name ?? '—'}</span>
              </div>
              <div className="op-snapshot-screen">
                <div className="op-snapshot-corner tl">CH 03</div>
                <div className="op-snapshot-corner tr">● REC</div>
                <div className="op-snapshot-corner bl">320×240 · 4:3</div>
                <div className="op-snapshot-corner br">60.00 Hz</div>
                {currentView === 'games' && focused ? (
                  focused.video_path ? (
                    <video ref={videoRef} src={resolveAsset(focused.video_path)} autoPlay loop muted playsInline />
                  ) : focused.image_path ? (
                    <img src={resolveAsset(focused.image_path)} alt={focused.title} />
                  ) : (
                    <div className="op-snapshot-art">
                      <div className="ttl">{focused.title.toUpperCase()}</div>
                      {focused.developer && <div className="sub">{focused.developer.toUpperCase()}</div>}
                      <div className="copy">© {focused.year ?? '----'} · {selectedSystem?.display_name.toUpperCase()}</div>
                    </div>
                  )
                ) : (
                  <div className="op-snapshot-fallback">
                    <div className="glyph">⚠</div>
                    <div>NO SELECTION</div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical */}
            <div className="op-tech-pane">
              <div className="op-pane-head" style={{ borderBottom: '1px dashed var(--op-fg-faint)', marginBottom: 6, padding: '2px 0' }}>
                <span>TECHNICAL</span>
                <span className="right">{focused?.title?.slice(0,24) ?? '—'}</span>
              </div>
              {currentView === 'games' && focused ? (
                <div className="op-tech-grid">
                  <div className="op-tech-row"><span className="k">System</span><span className="v hi">{selectedSystem?.display_name}</span></div>
                  <div className="op-tech-row"><span className="k">Year</span><span className="v">{focused.year ?? '—'}</span></div>
                  <div className="op-tech-row"><span className="k">Maker</span><span className="v">{focused.developer ?? '—'}</span></div>
                  <div className="op-tech-row"><span className="k">Genre</span><span className="v">{focused.genre ?? '—'}</span></div>
                  <div className="op-tech-row"><span className="k">Players</span><span className="v">{focused.players ?? '—'}</span></div>
                  <div className="op-tech-row"><span className="k">Media</span><span className={`v ${focused.video_path ? 'hi' : focused.image_path ? '' : 'warn'}`}>{focused.video_path ? 'OK · VIDEO' : focused.image_path ? 'OK · IMG' : '⚠ MISSING'}</span></div>
                  <div className="op-tech-row"><span className="k">Plays</span><span className="v hi">{focused.play_count ?? 0}</span></div>
                  <div className="op-tech-row"><span className="k">Fav</span><span className={`v ${focused.is_favorite === 1 ? 'hi' : ''}`}>{focused.is_favorite === 1 ? '★ YES' : 'NO'}</span></div>
                </div>
              ) : (
                <div style={{ padding: 10, color: 'var(--op-fg-dim)', textAlign: 'center', letterSpacing: '.18em', textTransform: 'uppercase' }}>
                  {'> SELECT A GAME'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: view modes + controls */}
        <div className="op-bottom">
          <div className="op-view-modes">
            {VIEWS.map(v => (
              <div key={v.id} className={`op-view${viewMode === v.id ? ' active' : ''}`} onClick={() => setViewMode(v.id)}>
                <span className="key">{v.key}</span>
                <span>{v.label}</span>
              </div>
            ))}
          </div>
          <div className="op-controls">
            <div className="op-ctl"><span className="btn">A</span><b>LAUNCH</b><span>start rom</span></div>
            <div className="op-ctl"><span className="btn err">B</span><b>BACK</b><span>parent menu</span></div>
            <div className="op-ctl"><span className="btn warn">Y</span><b>FAV</b><span>toggle pin</span></div>
            <div className="op-ctl"><span className="btn">X</span><b>VIEW</b><span>cycle mode</span></div>
            <div className="spacer" />
            <div className="op-phosphor">
              <span>PHOSPHOR</span>
              <span className={`swatch green${phosphor==='green'?' active':''}`} style={{ color: '#66ff8a' }} onClick={() => setPhosphor('green')} />
              <span className={`swatch amber${phosphor==='amber'?' active':''}`} style={{ color: '#ffb33b' }} onClick={() => setPhosphor('amber')} />
              <span className={`swatch cyan${phosphor==='cyan'?' active':''}`}   style={{ color: '#7df0ff' }} onClick={() => setPhosphor('cyan')} />
              <span style={{ opacity: .5, marginLeft: 8 }}>[P] cycle</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* CRT global FX */}
      <div className="op-rgb" />
      <div className="op-scanlines" />
      <div className="op-vignette" />
      <div className="op-flicker" />
    </div>
  );
}
