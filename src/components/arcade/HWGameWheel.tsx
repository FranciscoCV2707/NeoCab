import { useRef, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Game, System } from '../../stores/types';

interface HWGameWheelProps {
  system: System;
  games: Game[];
  focusedIndex: number;
  onPlay: (game: Game) => void;
  loading: boolean;
}

const ITEM_H = 88; // px per item (height + margin*2)

function resolveAsset(path?: string): string | undefined {
  if (!path) return undefined;
  try { return convertFileSrc(path); } catch { return path; }
}

export function HWGameWheel({ system, games, focusedIndex, onPlay, loading }: HWGameWheelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const focused = games[focusedIndex];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [focusedIndex]);

  // Render a window of items
  const HALF = 8;
  const start = Math.max(0, focusedIndex - HALF - 1);
  const end   = Math.min(games.length, focusedIndex + HALF + 2);
  const slice = games.slice(start, end);

  // track translateY so focused item is centered at top:50%
  const trackY = -(focusedIndex * ITEM_H);

  return (
    <div className="hw-wheel-layout">
      {/* CRT */}
      <div className="hw-crt-wrap">
        <div>
          <div className="hw-crt">
            <div className="hw-crt-screen">
              <div className="hw-crt-content">
                {focused?.video_path ? (
                  <video
                    ref={videoRef}
                    key={focused.video_path}
                    src={resolveAsset(focused.video_path)}
                    autoPlay loop muted playsInline
                  />
                ) : focused?.image_path ? (
                  <img key={focused.image_path} src={resolveAsset(focused.image_path)} alt={focused.title} />
                ) : (
                  <div className="hw-crt-missing">
                    <div className="glyph">NO MEDIA</div>
                    <div className="ttl">{focused?.title ?? 'SIN JUEGO'}</div>
                    <div className="sub">ARTWORK NOT FOUND</div>
                  </div>
                )}
              </div>
              <div className="hw-crt-bulge" />
              <div className="hw-crt-scan" />
              <div className="hw-crt-rgb" />
              <div className="hw-crt-rolling" />
              <span className="hw-crt-corner tl">{system.name.toUpperCase()}</span>
              <span className="hw-crt-corner tr">{focused?.year ?? ''}</span>
              <span className="hw-crt-corner bl">{focused?.genre ?? ''}</span>
              <span className="hw-crt-corner br">
                {games.length > 0 ? `${focusedIndex + 1} / ${games.length}` : ''}
              </span>
            </div>
          </div>
          <div className="hw-crt-strip">
            <span className="pip" />
            <span className="bar" />
            <span>{system.display_name.toUpperCase()} · {games.length} TITLES</span>
          </div>
        </div>
      </div>

      {/* Center: game info */}
      <div className="hw-center">
        {focused?.is_favorite === 1 && (
          <div className="hw-fav-mark">
            <span style={{
              width:16, height:16, background:'var(--magenta)', display:'inline-block',
              clipPath:'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
              filter:'drop-shadow(0 0 6px var(--magenta))',
            }} />
            FAVORITO
          </div>
        )}

        <div className="hw-logo-stage">
          {focused ? (
            <div className="hw-game-logo">
              <div className="hw-gl-pill">
                <span className="sq" />
                {system.display_name.toUpperCase()}
              </div>
              <div className="hw-gl-title">{focused.title}</div>
              {focused.developer && (
                <div className="hw-gl-sub">{focused.developer.toUpperCase()}</div>
              )}
              <div className="hw-gl-divider" />
            </div>
          ) : (
            <div style={{ fontFamily:'var(--f-stencil)', fontSize:32, letterSpacing:4, opacity:.3 }}>
              SIN JUEGOS
            </div>
          )}
        </div>

        <div className="hw-meta">
          <div className="hw-meta-cell">
            <div className="k">AÑO</div>
            <div className="v">{focused?.year ?? '—'}</div>
          </div>
          <div className="hw-meta-cell">
            <div className="k">GÉNERO</div>
            <div className="v">{focused?.genre ?? '—'}</div>
          </div>
          <div className="hw-meta-cell">
            <div className="k">JUGADORES</div>
            <div className="v">{focused?.players ?? '—'}</div>
          </div>
          <div className="hw-meta-cell">
            <div className="k">PARTIDAS</div>
            <div className="v hi">{(focused?.play_count ?? 0).toString().padStart(4,'0')}</div>
          </div>
        </div>
      </div>

      {/* Wheel */}
      <div className="hw-wheel-col">
        <div className="hw-wheel-header">
          <span>TÍTULO</span>
          <b>{focusedIndex + 1}</b>
          <span>/</span>
          <span className="v">{games.length}</span>
        </div>

        <div className="hw-wheel-frame">
          <div
            className="hw-wheel-track"
            style={{ transform: `translateY(${trackY}px)` }}
          >
            {slice.map((game, si) => {
              const realIdx = start + si;
              const d = realIdx - focusedIndex;
              const abs = Math.abs(d);
              const cls = `hw-wheel-item${d === 0 ? ' active' : abs === 1 ? ' near' : abs > 4 ? ' far' : ''}`;

              return (
                <button
                  key={game.id}
                  className={cls}
                  tabIndex={-1}
                  onClick={() => !loading && onPlay(game)}
                  disabled={loading}
                >
                  <div className={`hw-wheel-card${game.is_favorite === 1 ? ' is-fav' : ''}`}>
                    <span className="num">{(realIdx + 1).toString().padStart(3,'0')}</span>
                    <span className="ttl">{game.title}</span>
                    <span className="star" />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="hw-wheel-rail" />
        </div>
      </div>
    </div>
  );
}
