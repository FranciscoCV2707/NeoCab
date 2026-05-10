interface Game {
  id: number;
  title: string;
  system_id: number;
  rom_path: string;
  crc32?: string;
}

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

interface GameListProps {
  system: System;
  games: Game[];
  onPlayGame: (game: Game) => void;
  onBack: () => void;
  loading: boolean;
}

export default function GameList({
  system,
  games,
  onPlayGame,
  onBack,
  loading,
}: GameListProps) {
  return (
    <div className="game-list-container">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>{system.display_name}</h2>
        <span className="game-count">{games.length} games</span>
      </div>

      <div className="games-list">
        {games.length === 0 ? (
          <div className="empty-state">
            <p>No games found for this system</p>
            <p className="hint">Scan ROMs to populate game library</p>
          </div>
        ) : (
          games.map((game) => (
            <button
              key={game.id}
              className="game-item"
              onClick={() => onPlayGame(game)}
              disabled={loading}
            >
              <div className="game-info">
                <div className="game-title">{game.title}</div>
                <div className="game-path">{game.rom_path}</div>
              </div>
              <div className="game-action">▶</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
