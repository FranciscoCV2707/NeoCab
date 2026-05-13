import React from 'react';

export const WelcomeStep: React.FC = () => {
  return (
    <div className="setup-step welcome-step">
      <h2>Welcome to NeoCab</h2>

      <div className="welcome-content">
        <div className="welcome-section">
          <h3>🎮 Professional Arcade Cabinet OS</h3>
          <p>
            NeoCab v3.0 is a complete operating system for arcade cabinets, featuring:
          </p>
          <ul>
            <li>300+ emulators with unified interface</li>
            <li>Advanced coin and timer system</li>
            <li>Universal input configuration</li>
            <li>Professional operator panel</li>
            <li>Customizable themes and media</li>
            <li>Full kiosk mode support</li>
          </ul>
        </div>

        <div className="welcome-section">
          <h3>📋 Setup Overview</h3>
          <p>This wizard will guide you through:</p>
          <ol>
            <li><strong>ROM Directory</strong> - Where your game files are stored</li>
            <li><strong>Media Directory</strong> - Wheels, box art, backgrounds</li>
            <li><strong>Select Systems</strong> - Which emulators to enable</li>
            <li><strong>Configure Input</strong> - Controller/joystick setup</li>
            <li><strong>Operator PIN</strong> - Security and administration</li>
            <li><strong>Review</strong> - Verify your configuration</li>
          </ol>
        </div>

        <div className="welcome-section">
          <h3>⚡ Quick Tips</h3>
          <ul>
            <li>Ensure ROMs are organized in system-specific folders (MAME/, NES/, SNES/, etc.)</li>
            <li>Media should follow HyperSpin structure (media/System/Images/)</li>
            <li>Operator PIN is 4 digits - choose something you'll remember</li>
            <li>Input configuration can be changed anytime in settings</li>
            <li>You can run this wizard again from Settings → Setup Wizard</li>
          </ul>
        </div>

        <div className="welcome-section info">
          <p>
            <strong>💡 Need Help?</strong> Visit the documentation at{' '}
            <code>./docs/SETUP_GUIDE.md</code> or check{' '}
            <code>./docs/TROUBLESHOOTING.md</code>
          </p>
        </div>
      </div>

      <div className="welcome-footer">
        <p className="version">NeoCab v3.0 • 16-week development • Professional grade</p>
      </div>
    </div>
  );
};
