import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./AuditPanel.css";

interface AuditResult {
  total_games: number;
  missing_images: number;
  missing_videos: number;
  message: string;
}

export default function AuditPanel() {
  const [results, setResults] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await invoke<string>("audit_media");
      setResults(JSON.parse(res));
    } catch (err) {
      console.error("Audit failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  if (loading) return <div className="audit-loading">Analyzing library...</div>;
  if (!results) return null;

  const imageHealth = Math.round(((results.total_games - results.missing_images) / results.total_games) * 100);
  const videoHealth = Math.round(((results.total_games - results.missing_videos) / results.total_games) * 100);

  return (
    <div className="audit-panel">
      <h2>Library Health Audit</h2>
      
      <div className="audit-stats">
        <div className="audit-card">
          <h3>Images</h3>
          <div className="audit-chart">
            <div className="chart-fill" style={{ width: `${imageHealth}%` }}></div>
            <span>{imageHealth}%</span>
          </div>
          <p>{results.total_games - results.missing_images} / {results.total_games}</p>
        </div>

        <div className="audit-card">
          <h3>Videos</h3>
          <div className="audit-chart">
            <div className="chart-fill video" style={{ width: `${videoHealth}%` }}></div>
            <span>{videoHealth}%</span>
          </div>
          <p>{results.total_games - results.missing_videos} / {results.total_games}</p>
        </div>
      </div>

      <div className="audit-actions">
        <button className="audit-refresh" onClick={runAudit}>Refresh Audit</button>
      </div>
    </div>
  );
}
