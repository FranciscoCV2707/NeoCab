import React, { useState } from 'react';
import './GameMetadataEditor.css';

export interface GameMetadata {
  game_id: string;
  title: string;
  description: string;
  year?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  players?: number;
  rating?: number;
}

interface GameMetadataEditorProps {
  game: GameMetadata;
  onSave: (metadata: GameMetadata) => Promise<void>;
  onCancel: () => void;
}

export const GameMetadataEditor: React.FC<GameMetadataEditorProps> = ({
  game,
  onSave,
  onCancel,
}) => {
  const [edited, setEdited] = useState(game);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(edited);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="game-metadata-editor">
      <div className="editor-header">
        <h3>Editar Metadata: {game.title}</h3>
      </div>

      <div className="editor-content">
        <div className="metadata-section">
          <label>Título:</label>
          <input
            type="text"
            value={edited.title}
            onChange={(e) => setEdited({ ...edited, title: e.target.value })}
            placeholder="Nombre del juego"
          />
        </div>

        <div className="metadata-section">
          <label>Descripción:</label>
          <textarea
            value={edited.description}
            onChange={(e) => setEdited({ ...edited, description: e.target.value })}
            placeholder="Descripción del juego"
            rows={4}
          />
        </div>

        <div className="metadata-row">
          <div className="metadata-section">
            <label>Año:</label>
            <input
              type="number"
              value={edited.year || ''}
              onChange={(e) =>
                setEdited({ ...edited, year: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="2024"
            />
          </div>

          <div className="metadata-section">
            <label>Desarrollador:</label>
            <input
              type="text"
              value={edited.developer || ''}
              onChange={(e) =>
                setEdited({ ...edited, developer: e.target.value || undefined })
              }
              placeholder="Nombre del desarrollador"
            />
          </div>
        </div>

        <div className="metadata-row">
          <div className="metadata-section">
            <label>Publicadora:</label>
            <input
              type="text"
              value={edited.publisher || ''}
              onChange={(e) =>
                setEdited({ ...edited, publisher: e.target.value || undefined })
              }
              placeholder="Nombre de la publicadora"
            />
          </div>

          <div className="metadata-section">
            <label>Género:</label>
            <input
              type="text"
              value={edited.genre || ''}
              onChange={(e) => setEdited({ ...edited, genre: e.target.value || undefined })}
              placeholder="Acción, Aventura, etc."
            />
          </div>
        </div>

        <div className="metadata-row">
          <div className="metadata-section">
            <label>Jugadores:</label>
            <input
              type="number"
              value={edited.players || ''}
              onChange={(e) =>
                setEdited({
                  ...edited,
                  players: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="1"
              min="1"
              max="4"
            />
          </div>

          <div className="metadata-section">
            <label>Calificación (0-5):</label>
            <input
              type="number"
              value={edited.rating || ''}
              onChange={(e) =>
                setEdited({
                  ...edited,
                  rating: e.target.value ? Math.min(5, Math.max(0, parseFloat(e.target.value))) : undefined,
                })
              }
              placeholder="3.5"
              min="0"
              max="5"
              step="0.5"
            />
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? '💾 Guardando...' : '💾 Guardar'}
        </button>
        <button className="btn-cancel" onClick={onCancel} disabled={saving}>
          ✕ Cancelar
        </button>
      </div>
    </div>
  );
};

export default GameMetadataEditor;
