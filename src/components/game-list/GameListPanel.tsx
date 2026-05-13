import React, { useEffect, useRef } from 'react';
import './GameListPanel.css';

export interface GameItem {
  id: string;
  name: string;
  year?: string;
  manufacturer?: string;
  players?: number;
  rating?: number;
  description?: string;
  boxArtUrl?: string;
}

interface GameListPanelProps {
  games: GameItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onConfirm: (game: GameItem) => void;
  systemName?: string;
  showDescription?: boolean;
  scrollBehavior?: 'smooth' | 'auto';
}

/**
 * Game list panel for arcade cabinet
 * Displays games in vertical scrolling list with info
 */
export const GameListPanel: React.FC<GameListPanelProps> = ({
  games,
  selectedIndex,
  onSelect,
  onConfirm,
  systemName = 'System',
  showDescription = true,
  scrollBehavior = 'smooth',
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (listRef.current && games.length > 0) {
      const items = listRef.current.querySelectorAll('.game-item');
      const selectedItem = items[selectedIndex] as HTMLElement;

      if (selectedItem) {
        const container = listRef.current;
        const itemTop = selectedItem.offsetTop;
        const itemHeight = selectedItem.offsetHeight;
        const containerHeight = container.clientHeight;
        const containerScrollTop = container.scrollTop;

        // Scroll to keep selected item in middle of view
        if (itemTop < containerScrollTop) {
          container.scrollTo({ top: itemTop - 50, behavior: scrollBehavior });
        } else if (itemTop + itemHeight > containerScrollTop + containerHeight) {
          container.scrollTo({
            top: itemTop - containerHeight / 2 + itemHeight / 2,
            behavior: scrollBehavior,
          });
        }
      }
    }
  }, [selectedIndex, games.length, scrollBehavior]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (selectedIndex > 0) {
            onSelect(selectedIndex - 1);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (selectedIndex < games.length - 1) {
            onSelect(selectedIndex + 1);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (games[selectedIndex]) {
            onConfirm(games[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, games, onSelect, onConfirm]);

  return (
    <div className="game-list-panel">
      <div className="list-header">
        <h3 className="system-title">{systemName}</h3>
        <div className="list-counter">
          {games.length > 0 && `${selectedIndex + 1} / ${games.length}`}
        </div>
      </div>

      <div className="list-container" ref={listRef}>
        {games.length === 0 ? (
          <div className="empty-state">
            <p>No games found</p>
          </div>
        ) : (
          games.map((game, index) => (
            <div
              key={game.id}
              className={`game-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(index)}
              onDoubleClick={() => onConfirm(game)}
            >
              <div className="game-item-left">
                <span className="game-index">{index + 1}.</span>
                <span className="game-name">{game.name}</span>
              </div>
              <div className="game-item-right">
                {game.year && <span className="game-year">{game.year}</span>}
                {game.players && <span className="game-players">{game.players}P</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {games[selectedIndex] && (
        <div className="game-info-panel">
          <div className="game-detail">
            {games[selectedIndex].boxArtUrl && (
              <img
                src={games[selectedIndex].boxArtUrl}
                alt={games[selectedIndex].name}
                className="game-artwork"
              />
            )}
            <div className="game-metadata">
              <h4 className="game-full-name">{games[selectedIndex].name}</h4>
              {games[selectedIndex].year && (
                <p className="metadata-item">
                  <span className="metadata-label">Year:</span>
                  {games[selectedIndex].year}
                </p>
              )}
              {games[selectedIndex].manufacturer && (
                <p className="metadata-item">
                  <span className="metadata-label">Maker:</span>
                  {games[selectedIndex].manufacturer}
                </p>
              )}
              {games[selectedIndex].players && (
                <p className="metadata-item">
                  <span className="metadata-label">Players:</span>
                  {games[selectedIndex].players}
                </p>
              )}
              {games[selectedIndex].rating && (
                <p className="metadata-item">
                  <span className="metadata-label">Rating:</span>
                  {'★'.repeat(Math.floor(games[selectedIndex].rating!))}
                </p>
              )}
            </div>
          </div>

          {showDescription && games[selectedIndex].description && (
            <div className="game-description">
              {games[selectedIndex].description}
            </div>
          )}

          <div className="game-actions">
            <button className="action-button primary">
              ▶ START GAME
            </button>
            <button className="action-button secondary">
              ⓘ INFO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameListPanel;
