interface MainMenuProps {
  onScanROMs: () => void;
  onSelectSystem: () => void;
  loading: boolean;
  scanProgress: string;
}

export default function MainMenu({
  onScanROMs,
  onSelectSystem,
  loading,
  scanProgress,
}: MainMenuProps) {
  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>NeoCab</h1>
        <p className="subtitle">Professional Arcade Cabinet System</p>
      </div>

      <div className="menu-content">
        {scanProgress && (
          <div className="scan-progress">
            <p>{scanProgress}</p>
          </div>
        )}

        <div className="menu-buttons">
          <button
            className="menu-button large"
            onClick={onSelectSystem}
            disabled={loading}
          >
            <span className="button-text">Play Game</span>
            <span className="button-icon">▶</span>
          </button>

          <button
            className="menu-button"
            onClick={onScanROMs}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Scan ROMs"}
          </button>

          <button className="menu-button">
            Coin Status: $0.00
          </button>

          <button className="menu-button">
            Settings
          </button>
        </div>
      </div>

      <div className="menu-footer">
        <p>Ready to play • {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
