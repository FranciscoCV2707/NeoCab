import { useState } from 'react';
import { t } from '../i18n';
import PinPad from './PinPad';
import './PinPad.css';

interface MainMenuProps {
  onScanROMs: () => void;
  onSelectSystem: () => void;
  onShowOperator: () => void;
  loading: boolean;
  scanProgress: string;
}

export default function MainMenu({
  onScanROMs,
  onSelectSystem,
  onShowOperator,
  loading,
  scanProgress,
}: MainMenuProps) {
  const [showPinPad, setShowPinPad] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleProtectedAction = (action: string) => {
    setPendingAction(action);
    setShowPinPad(true);
  };

  const handlePinSuccess = () => {
    setShowPinPad(false);
    if (pendingAction === 'settings') {
      onShowOperator(); // Using operator for settings too for now
    } else if (pendingAction === 'operator') {
      onShowOperator();
    }
    setPendingAction(null);
  };

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
            <span className="button-text">{t('PLAY_ARCADE')}</span>
            <span className="button-icon">▶</span>
          </button>

          <button
            className="menu-button"
            onClick={onScanROMs}
            disabled={loading}
          >
            {loading ? "..." : t('SCAN_ROMS')}
          </button>

          <button 
            className="menu-button" 
            onClick={() => handleProtectedAction('settings')}
          >
            {t('SETTINGS')}
          </button>

          <button 
            className="menu-button"
            onClick={() => handleProtectedAction('operator')}
          >
            {t('OPERATOR_PANEL')}
          </button>
        </div>
      </div>

      <div className="menu-footer">
        <p>Ready to play • {new Date().toLocaleTimeString()}</p>
      </div>

      {showPinPad && (
        <PinPad 
          expectedPin="1234" 
          onSuccess={handlePinSuccess}
          onCancel={() => {
            setShowPinPad(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
