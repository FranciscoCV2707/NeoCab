import { useState, useRef, useEffect, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { t } from "../i18n";
import LeaderboardPanel from './LeaderboardPanel';

interface Game {
  id: number;
  title: string;
  system_id: number;
  rom_path: string;
  filename?: string;
  crc32?: string;
  is_favorite: number;
  video_path?: string;
  image_path?: string;
  wheel_path?: string;
  marquee_path?: string;
  description?: string;
  developer?: string;
  publisher?: string;
  year?: number;
  players?: number;
  genre?: string;
  play_count?: number;
  total_play_time?: number;
  last_played?: string;
  rating?: number;
}

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

type SortField = "title" | "year" | "genre" | "play_count" | "rating";
type SortOrder = "asc" | "desc";

interface GameListProps {
  system: System;
  games: Game[];
  onPlayGame: (game: Game) => void;
  onBack: () => void;
  loading: boolean;
  focusedIndex: number;
}

const VISIBLE_BUFFER = 30; // Virtual scroll: render only ~30 items around focus

export default function GameList({
  system,
  games,
  onPlayGame,
  onBack,
  loading,
  focusedIndex,
}: GameListProps) {
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extract unique genres and years for filter dropdowns
  const genres = [...new Set(games.map(g => g.genre).filter(Boolean))] as string[];
  const years = [...new Set(games.map(g => g.year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));

  // Apply filters and sorting
  const processedGames = useCallback(() => {
    let result = [...games];

    // Filters
    if (filterFavorites) {
      result = result.filter(g => g.is_favorite === 1);
    }
    if (filterGenre) {
      result = result.filter(g => g.genre?.toLowerCase().includes(filterGenre.toLowerCase()));
    }
    if (filterYear) {
      result = result.filter(g => g.year?.toString() === filterYear);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "year":
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case "genre":
          comparison = (a.genre || "").localeCompare(b.genre || "");
          break;
        case "play_count":
          comparison = (a.play_count || 0) - (b.play_count || 0);
          break;
        case "rating":
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [games, filterFavorites, filterGenre, filterYear, sortField, sortOrder]);

  const displayGames = processedGames();

  // Virtual scrolling: only render items near the focused index
  const startIndex = Math.max(0, focusedIndex - VISIBLE_BUFFER);
  const endIndex = Math.min(displayGames.length, focusedIndex + VISIBLE_BUFFER);
  const visibleGames = displayGames.slice(startIndex, endIndex);

  // Auto-scroll focused item into view
  useEffect(() => {
    const focusedElement = document.querySelector('.game-item.focused');
    if (focusedElement) {
      focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Emit event for Marquee display
  useEffect(() => {
    const currentGame = displayGames[focusedIndex];
    if (currentGame) {
      emit("game_focused", {
        title: currentGame.title,
        marquee_path: currentGame.marquee_path || undefined,
        image_path: currentGame.image_path || undefined,
        system_name: system.display_name,
      }).catch(console.error);
    }
  }, [focusedIndex, displayGames, system.display_name]);

  // Resolve file paths for Tauri
  const resolveAssetPath = (path?: string) => {
    if (!path) return undefined;
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  };

  const currentGame = displayGames[focusedIndex];

  return (
    <div className="game-list-container">
      {/* Header with filters */}
      <div className="header">
        <button className="back-button" onClick={onBack}>← {t('BACK')}</button>
        <h2>{system.display_name}</h2>
        <div className="header-actions">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔽 {t('FILTERS')}
          </button>
          <span className="game-count">{displayGames.length} / {games.length} {t('GAMES')}</span>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <label>{t('SORT')}</label>
            <select 
              value={sortField} 
              onChange={e => setSortField(e.target.value as SortField)}
              className="filter-select"
            >
              <option value="title">{t('TITLE')}</option>
              <option value="year">{t('YEAR')}</option>
              <option value="genre">{t('GENRE')}</option>
              <option value="play_count">{t('MOST_PLAYED')}</option>
              <option value="rating">{t('RATING')}</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          <div className="filter-group">
            <label>{t('GENRE')}</label>
            <select 
              value={filterGenre} 
              onChange={e => setFilterGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('ALL')}</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('YEAR')}</label>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('ALL')}</option>
              {years.map(y => <option key={y} value={y?.toString()}>{y}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <input 
                type="checkbox" 
                checked={filterFavorites}
                onChange={e => setFilterFavorites(e.target.checked)}
              />
              ★ {t('FAVORITES')}
            </label>
          </div>

          <button 
            className="filter-clear"
            onClick={() => { setFilterGenre(""); setFilterYear(""); setFilterFavorites(false); setSortField("title"); setSortOrder("asc"); }}
          >
            ✕ {t('CLEAR')}
          </button>
        </div>
      )}

      <div className="game-layout">
        {/* Game List (left side) */}
        <div className="games-list" ref={listRef}>
          {displayGames.length === 0 ? (
            <div className="empty-state">
              <p>{t('NO_GAMES_FOUND')}</p>
              <p className="hint">
                {games.length > 0 ? "Try adjusting your filters" : t('SCAN_HINT')}
              </p>
            </div>
          ) : (
            <>
              {/* Virtual scroll spacer top */}
              {startIndex > 0 && <div style={{ height: startIndex * 55 }} />}
              
              {visibleGames.map((game, i) => {
                const realIndex = startIndex + i;
                return (
                  <button
                    key={game.id}
                    className={`game-item ${realIndex === focusedIndex ? 'focused' : ''}`}
                    onClick={() => onPlayGame(game)}
                    disabled={loading}
                  >
                    <div className="game-info">
                      <div className="game-title">
                        {game.wheel_path ? (
                          <img src={resolveAssetPath(game.wheel_path)} alt={game.title} className="game-wheel-icon" />
                        ) : (
                          <>
                            {game.is_favorite === 1 && <span className="fav-star">★</span>}
                            {game.title}
                          </>
                        )}
                      </div>
                      <div className="game-meta-row">
                        {game.year && <span className="meta-tag">{game.year}</span>}
                        {game.genre && <span className="meta-tag">{game.genre}</span>}
                        {game.players && <span className="meta-tag">{game.players}P</span>}
                        {(game.play_count ?? 0) > 0 && <span className="meta-tag played">▶ {game.play_count}</span>}
                      </div>
                    </div>
                    <div className="game-action">▶</div>
                  </button>
                );
              })}

              {/* Virtual scroll spacer bottom */}
              {endIndex < displayGames.length && <div style={{ height: (displayGames.length - endIndex) * 55 }} />}
            </>
          )}
        </div>

        {/* Game Preview Panel (right side) */}
        {currentGame && (
          <div className="game-preview-panel">
            {/* Video Preview */}
            {currentGame.video_path ? (
              <div className="preview-video-container">
                <video
                  ref={videoRef}
                  key={currentGame.video_path}
                  src={resolveAssetPath(currentGame.video_path)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="preview-video"
                  onError={() => {
                    // Fallback to image if video fails
                    if (videoRef.current) videoRef.current.style.display = 'none';
                  }}
                />
              </div>
            ) : currentGame.image_path ? (
              <div className="preview-image-container">
                <img
                  src={resolveAssetPath(currentGame.image_path)}
                  alt={currentGame.title}
                  className="preview-image"
                />
              </div>
            ) : (
              <div className="preview-placeholder">
                <span className="preview-placeholder-icon">🎮</span>
                <span>{currentGame.title}</span>
              </div>
            )}

            {/* Game Info */}
            <div className="preview-info">
              <h3 className="preview-title">{currentGame.title}</h3>
              {currentGame.developer && (
                <p className="preview-developer">{currentGame.developer}</p>
              )}
              <div className="preview-tags">
                {currentGame.year && <span className="info-tag">{currentGame.year}</span>}
                {currentGame.genre && <span className="info-tag">{currentGame.genre}</span>}
                {currentGame.players && <span className="info-tag">{currentGame.players} {t('PLAYERS')}</span>}
                {currentGame.rating && currentGame.rating > 0 && (
                  <span className="info-tag rating">★ {currentGame.rating.toFixed(1)}</span>
                )}
              </div>
              {currentGame.description && (
                <p className="preview-description">{currentGame.description.substring(0, 300)}
                  {currentGame.description.length > 300 ? "..." : ""}
                </p>
              )}
              <LeaderboardPanel gameId={currentGame.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
