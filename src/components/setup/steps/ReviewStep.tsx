import React from 'react';

interface SetupConfig {
  romDirectory: string;
  mediaDirectory: string;
  selectedSystems: string[];
  inputDevice: string;
  operatorPin: string;
  autoboot: boolean;
  kioskMode: boolean;
  theme: string;
}

interface ReviewStepProps {
  config: SetupConfig;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ config }) => {
  const systemLabels: Record<string, string> = {
    mame: 'MAME',
    nes: 'Nintendo NES',
    snes: 'Super NES',
    genesis: 'Sega Genesis',
    gbc: 'Game Boy Color',
    ps1: 'PlayStation 1',
    n64: 'Nintendo 64',
  };

  return (
    <div className="setup-step">
      <h2>Review Configuration</h2>
      <p>Please review your setup. You can go back to edit any settings.</p>

      <div className="review-sections">
        <div className="review-section">
          <h3>📁 Directories</h3>
          <dl>
            <dt>ROM Directory:</dt>
            <dd className="path">{config.romDirectory}</dd>
            <dt>Media Directory:</dt>
            <dd className="path">{config.mediaDirectory}</dd>
          </dl>
        </div>

        <div className="review-section">
          <h3>🎮 Systems</h3>
          <div className="systems-list">
            {config.selectedSystems.map(sys => (
              <span key={sys} className="system-badge">
                {systemLabels[sys] || sys}
              </span>
            ))}
          </div>
          <small>Total: {config.selectedSystems.length} system(s)</small>
        </div>

        <div className="review-section">
          <h3>⌨️ Input & Security</h3>
          <dl>
            <dt>Input Device:</dt>
            <dd>{config.inputDevice === 'auto' ? 'Auto-Detect' : config.inputDevice}</dd>
            <dt>Operator PIN:</dt>
            <dd>
              <code>{'●'.repeat(config.operatorPin.length)}</code> (4 digits)
            </dd>
          </dl>
        </div>

        <div className="review-section">
          <h3>⚙️ Options</h3>
          <dl>
            <dt>Autoboot:</dt>
            <dd>{config.autoboot ? 'Enabled' : 'Disabled'}</dd>
            <dt>Kiosk Mode:</dt>
            <dd>{config.kioskMode ? 'Enabled' : 'Disabled'}</dd>
            <dt>Theme:</dt>
            <dd className="capitalize">{config.theme}</dd>
          </dl>
        </div>
      </div>

      <div className="info-box">
        <h3>✅ Ready to Begin</h3>
        <p>
          Click <strong>Complete Setup</strong> to apply these settings. NeoCab will:
        </p>
        <ol>
          <li>Scan your ROM directory</li>
          <li>Organize your media files</li>
          <li>Initialize the database</li>
          <li>Launch the main interface</li>
        </ol>
      </div>

      <div className="info-box warning">
        <p>
          <strong>Note:</strong> Initial setup may take 1-5 minutes depending on ROM library size.
          Please wait...
        </p>
      </div>
    </div>
  );
};
