import { useState, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { t } from "../i18n";

import { Game } from "../stores/types";

interface AttractModeProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
  onExit: () => void;
}

export default function AttractMode({ games, onPlayGame, onExit }: AttractModeProps) {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Filter games that actually have videos
  const videoGames = games.filter(g => g.video_path);

  useEffect(() => {
    // If no games have videos, just exit attract mode
    if (videoGames.length === 0) {
      onExit();
      return;
    }

    // Pick a random game initially
    const initialIndex = Math.floor(Math.random() * videoGames.length);
    setCurrentGameIndex(initialIndex);
  }, []);

  const handleVideoEnded = () => {
    // Pick the next random game
    if (videoGames.length > 0) {
      setCurrentGameIndex(Math.floor(Math.random() * videoGames.length));
    }
  };

  const resolveAssetPath = (path?: string) => {
    if (!path) return undefined;
    try {
      return convertFileSrc(path);
    } catch {
      return path;
    }
  };

  if (videoGames.length === 0) return null;
  const currentGame = videoGames[currentGameIndex];

  return (
    <div className="attract-mode-fullscreen" onClick={() => onPlayGame(currentGame)}>
      {currentGame.video_path ? (
        <video
          ref={videoRef}
          src={resolveAssetPath(currentGame.video_path)}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoEnded}
          className="attract-video"
        />
      ) : (
        <div className="attract-fallback">
          <h2>{currentGame.title}</h2>
        </div>
      )}

      <div className="attract-overlay-ui">
        <div className="attract-title-card">
          <h1>{currentGame.title}</h1>
          <p>{t('ATTRACT_MODE')}</p>
        </div>
        <div className="attract-insert-coin-blink">
          PRESS START TO PLAY
        </div>
      </div>
    </div>
  );
}
