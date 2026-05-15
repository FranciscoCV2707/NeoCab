import { useState, useEffect } from 'react';
import { t } from '../i18n';
import PinPad from './PinPad';
import './MainMenu.css';

interface MainMenuProps {
  onScanROMs: () => void;
  onSelectSystem: () => void;
  onShowOperator: () => void;
  loading: boolean;
  scanProgress: string;
  locale?: string;
  onLocaleChange?: (locale: string) => void;
}

export default function MainMenu({
  onScanROMs,
  onSelectSystem,
  onShowOperator,
  loading,
  scanProgress,
  locale,
  onLocaleChange,
}: MainMenuProps) {
  const [showPinPad, setShowPinPad] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setLogoLoaded(true);
    return () => clearInterval(timer);
  }, []);

  const handleProtectedAction = (action: string) => {
    setPendingAction(action);
    setShowPinPad(true);
  };

  const handlePinSuccess = () => {
    setShowPinPad(false);
    if (pendingAction === 'settings' || pendingAction === 'operator') {
      onShowOperator();
    }
    setPendingAction(null);
  };

  const menuItems = [
    {
      id: 'play',
      label: t('PLAY_ARCADE'),
      icon: '▶',
      action: onSelectSystem,
      primary: true,
      disabled: loading,
    },
    {
      id: 'scan',
      label: loading ? 'Scanning...' : t('SCAN_ROMS'),
      icon: '🔍',
      action: onScanROMs,
      primary: false,
      disabled: loading,
    },
    {
      id: 'settings',
      label: t('SETTINGS'),
      icon: '⚙',
      action: () => handleProtectedAction('settings'),
      primary: false,
      disabled: false,
    },
    {
      id: 'operator',
      label: t('OPERATOR_PANEL'),
      icon: '🔧',
      action: () => handleProtectedAction('operator'),
      primary: false,
      disabled: false,
    },
  ];

  return (
    <div className="main-menu">
      <div className="menu-background" />
      <div className="menu-particles" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i * 0.5) % 3}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="menu-header">
        <div className={`logo-container ${logoLoaded ? 'loaded' : ''}`}>
          <h1 className="logo-text">
            <span className="logo-neo">Neo</span>
            <span className="logo-cab">Cab</span>
          </h1>
          <div className="logo-glow" />
        </div>
        <p className="menu-subtitle">Professional Arcade Cabinet System</p>
        {scanProgress && (
          <div className="scan-progress">
            <div className="scan-progress-bar">
              <div className="scan-progress-fill" />
            </div>
            <span>{scanProgress}</span>
          </div>
        )}
      </div>

      <div className="menu-content">
        <div className="menu-buttons">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-button ${item.primary ? 'primary' : 'secondary'} ${item.disabled ? 'disabled' : ''}`}
              onClick={item.action}
              disabled={item.disabled}
            >
              <span className="button-icon">{item.icon}</span>
              <span className="button-label">{item.label}</span>
              {item.primary && <span className="button-arrow">→</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-footer">
        <div className="footer-status">
          <span className="status-dot" />
          <span>Ready to play</span>
        </div>
        <div className="footer-right">
          {onLocaleChange && (
            <select
              className="locale-select"
              value={locale || "en"}
              onChange={(e) => onLocaleChange(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
              <option value="pt-br">PT</option>
            </select>
          )}
          <div className="footer-time">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
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
