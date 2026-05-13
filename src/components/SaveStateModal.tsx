import { convertFileSrc } from "@tauri-apps/api/core";
import "./SaveStateModal.css";
import { Game } from "../App";

export interface SaveState {
  id: number;
  game_id: number;
  slot: number;
  save_path: string;
  thumbnail?: string;
  description?: string;
  play_time: number;
  created_at?: string;
}

interface SaveStateModalProps {
  game: Game;
  saveStates: SaveState[];
  onPlayNew: () => void;
  onPlayState: (state: SaveState) => void;
  onCancel: () => void;
}

export default function SaveStateModal({ game, saveStates, onPlayNew, onPlayState, onCancel }: SaveStateModalProps) {
  const resolveAssetPath = (path?: string) => {
    if (!path) return undefined;
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  };

  return (
    <div className="save-state-overlay" onClick={onCancel}>
      <div className="save-state-container" onClick={e => e.stopPropagation()}>
        <div className="save-state-header">
          <h2>{game.title}</h2>
          <p>CHOOSE HOW TO START</p>
        </div>

        <div className="save-state-options">
          <button className="save-state-card new-game" onClick={onPlayNew}>
            <div className="state-thumb-placeholder">▶</div>
            <div className="state-info">
              <h3>Start New Game</h3>
              <p>Play from the beginning</p>
            </div>
          </button>

          {saveStates.map((state) => (
            <button 
              key={state.id} 
              className="save-state-card" 
              onClick={() => onPlayState(state)}
            >
              {state.thumbnail ? (
                <img src={resolveAssetPath(state.thumbnail)} alt="Save state" className="state-thumb" />
              ) : (
                <div className="state-thumb-placeholder">💾</div>
              )}
              <div className="state-info">
                <h3>Slot {state.slot}</h3>
                <p>{state.description || new Date(state.created_at || '').toLocaleString()}</p>
                <span className="play-time">{Math.floor(state.play_time / 60)}m played</span>
              </div>
            </button>
          ))}
        </div>

        <button className="save-state-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
