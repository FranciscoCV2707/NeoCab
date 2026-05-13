import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { t } from "../i18n";
import "./LeaderboardPanel.css";

interface Score {
  player: string;
  score: number;
  date: string;
}

interface LeaderboardPanelProps {
  gameId: number;
}

export default function LeaderboardPanel({ gameId }: LeaderboardPanelProps) {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const loadScores = async () => {
      try {
        const res = await invoke<Score[]>("get_high_scores", { gameId });
        if (res && res.length > 0) {
          setScores(res);
        } else {
          // Mock data for demo if empty
          setScores([
            { player: "PAK", score: 540000, date: "2023-05-13" },
            { player: "NEO", score: 420500, date: "2023-05-12" },
            { player: "CAB", score: 380000, date: "2023-05-10" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load scores", err);
      }
    };
    loadScores();
  }, [gameId]);

  return (
    <div className="leaderboard-panel">
      <h3>{t('TOP_SCORERS')}</h3>
      <div className="score-list">
        {scores.map((s, index) => (
          <div key={index} className="score-row">
            <span className="rank">{index + 1}</span>
            <span className="player">{s.player}</span>
            <span className="score">{s.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
