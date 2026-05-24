import React, { useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useGameStore } from "../../stores/useGameStore";
import { Game } from "../../stores/types";
import "./ShelfView.css";

interface ShelfViewProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
  loading: boolean;
  focusedIndex: number;
  systemName: string;
}

// Darken color helper for gradient calculations
function darkenColor(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * (percent * 100)),
    R = (num >> 16) - amt,
    G = ((num >> 8) & 0x00ff) - amt,
    B = (num & 0x0000ff) - amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
      (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
      (B < 0 ? 0 : B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)
  );
}

function getBrandColor(game: Game, systemName: string): string {
  const dev = (game.developer || "").toLowerCase();
  const pub = (game.publisher || "").toLowerCase();
  const sys = systemName.toLowerCase();

  if (dev.includes("nintendo") || pub.includes("nintendo") || sys.includes("nes") || sys.includes("snes") || sys.includes("n64")) {
    return "#e60012";
  }
  if (dev.includes("sega") || pub.includes("sega") || sys.includes("genesis") || sys.includes("megadrive") || sys.includes("dreamcast")) {
    return "#0089cf";
  }
  if (dev.includes("capcom") || pub.includes("capcom")) {
    return "#0050a0";
  }
  if (dev.includes("snk") || pub.includes("snk") || sys.includes("neogeo")) {
    return "#02a54b";
  }
  if (dev.includes("namco") || pub.includes("namco") || dev.includes("bandai")) {
    return "#f6003c";
  }
  if (sys.includes("mame") || sys.includes("arcade")) {
    return "#ff5f00";
  }
  if (sys.includes("playstation") || sys.includes("ps1") || sys.includes("ps2") || sys.includes("ps3")) {
    return "#003087";
  }
  
  // Hash fallback
  const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#34495e"];
  let hash = 0;
  const str = game.title + (game.developer || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ShelfView({
  games,
  onPlayGame,
  loading,
  focusedIndex,
  systemName,
}: ShelfViewProps) {
  const setFocusedIndex = useGameStore((s) => s.setFocusedIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (index: number) => {
    if (loading) return;
    if (index === focusedIndex) {
      onPlayGame(games[index]);
    } else {
      setFocusedIndex(index);
    }
  };

  if (games.length === 0) {
    return (
      <div className="shelf-view-container flex items-center justify-center">
        <p className="text-gray-400">No games found on shelf.</p>
      </div>
    );
  }

  const focusedGame = games[focusedIndex];
  const activeBrandColor = focusedGame ? getBrandColor(focusedGame, systemName) : "#00ffff";

  // Resolve file paths for Tauri
  const resolveAssetPath = (path?: string) => {
    if (!path) return undefined;
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  };

  return (
    <div className="shelf-view-container" ref={containerRef}>
      {/* Background ambient lighting */}
      <div 
        className="shelf-ambient-glow" 
        style={{ 
          background: `radial-gradient(circle at center, ${activeBrandColor}20 0%, transparent 75%)` 
        }} 
      />

      <div className="shelf-3d-scene">
        <div 
          className="shelf-3d-wrapper"
          style={{
            transform: `translate3d(calc(-${focusedIndex * 75}px), 0px, -200px)`
          }}
        >
          {/* Virtual Shelf Board */}
          <div className="shelf-board-3d">
            <div className="shelf-board-face shelf-board-top" />
            <div className="shelf-board-face shelf-board-front" style={{ borderBottomColor: activeBrandColor }} />
          </div>

          {/* Render Game Boxes */}
          {games.map((game, index) => {
            const isFocused = index === focusedIndex;
            const brandColor = getBrandColor(game, systemName);
            const darkBrand = darkenColor(brandColor, 0.4);
            const darkerBrand = darkenColor(brandColor, 0.6);

            // Determine custom transform based on focus and relative position to center
            let boxTransform = "";
            if (isFocused) {
              boxTransform = "translate3d(0, -40px, 90px) rotateY(-75deg)";
            } else if (index < focusedIndex) {
              boxTransform = "translate3d(0, 0, 0) rotateY(15deg)";
            } else {
              boxTransform = "translate3d(0, 0, 0) rotateY(-15deg)";
            }

            return (
              <div 
                key={game.id} 
                className={`shelf-game-box-wrapper ${isFocused ? "focused" : ""}`}
                style={{
                  left: `${index * 75}px`,
                  transform: boxTransform,
                }}
                onClick={() => handleItemClick(index)}
              >
                <div 
                  className="shelf-game-box"
                  style={{
                    "--brand-glow": `${brandColor}40`,
                    "--brand-color": brandColor,
                  } as React.CSSProperties}
                >
                  {/* Spine Face (facing forward on shelf) */}
                  <div 
                    className="box-face box-spine"
                    style={{
                      background: `linear-gradient(to bottom, ${brandColor}, ${darkBrand})`
                    }}
                  >
                    <div className="spine-title">{game.title}</div>
                    {game.wheel_path ? (
                      <img src={resolveAssetPath(game.wheel_path)} alt="" className="spine-logo-img" />
                    ) : (
                      <div className="spine-logo">NEOCAB</div>
                    )}
                  </div>

                  {/* Front Cover Face (facing right) */}
                  <div className="box-face box-front">
                    {game.image_path ? (
                      <img 
                        src={resolveAssetPath(game.image_path)} 
                        alt={game.title} 
                        className="front-cover-img" 
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className="front-cover-fallback"
                        style={{
                          background: `linear-gradient(135deg, ${brandColor}, ${darkerBrand})`
                        }}
                      >
                        <div className="fallback-title">{game.title}</div>
                        <div className="fallback-system">{systemName}</div>
                      </div>
                    )}
                  </div>

                  {/* Back Face (facing rear) */}
                  <div 
                    className="box-face box-back"
                    style={{ background: darkerBrand }}
                  >
                    <div className="back-content">
                      <div className="back-logo">NEOCAB</div>
                    </div>
                  </div>

                  {/* Left Side Face (facing left - plain side cover) */}
                  <div className="box-face box-left" style={{ background: "#1c1c1c" }} />

                  {/* Top Face */}
                  <div className="box-face box-top" style={{ background: "#252525" }} />

                  {/* Bottom Face */}
                  <div className="box-face box-bottom" style={{ background: "#151515" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium UI Overlay showing current focused game info */}
      {focusedGame && (
        <div className="shelf-game-title-overlay" style={{ borderTop: `2px solid ${activeBrandColor}` }}>
          <h3>{focusedGame.title}</h3>
          <p style={{ color: activeBrandColor }}>
            {[
              focusedGame.year,
              focusedGame.genre,
              focusedGame.players ? `${focusedGame.players}P` : null,
              focusedGame.rating ? `★ ${focusedGame.rating.toFixed(1)}` : null,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        </div>
      )}

      <div className="shelf-controls-hint">
        ← / → para navegar &bull; ENTER para jugar
      </div>
    </div>
  );
}
