import React, { useEffect } from 'react';
import './ThemePreview.css';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  success: string;
  error: string;
}

interface ThemePreviewProps {
  colors: ThemeColors;
  isLive?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ colors, isLive = true }) => {
  useEffect(() => {
    if (isLive) {
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
  }, [colors, isLive]);

  return (
    <div className="theme-preview">
      <h3 className="section-title">Live Preview</h3>

      <div className="preview-container" style={{
        '--theme-primary': colors.primary,
        '--theme-secondary': colors.secondary,
        '--theme-accent': colors.accent,
        '--theme-text': colors.text,
        '--theme-background': colors.background,
        '--theme-success': colors.success,
        '--theme-error': colors.error,
      } as React.CSSProperties}>

        <div className="preview-header">
          <h4>System Selector</h4>
          <span className="accent-badge">7 Systems</span>
        </div>

        <div className="preview-wheel">
          <div className="wheel-item selected" style={{ color: colors.accent }}>
            ★ MAME ★
          </div>
          <div className="wheel-item" style={{ color: colors.text }}>
            NES
          </div>
          <div className="wheel-item" style={{ color: colors.text }}>
            SNES
          </div>
        </div>

        <div className="preview-buttons">
          <button className="btn-primary" style={{
            backgroundColor: colors.primary,
            color: colors.text
          }}>START</button>
          <button className="btn-secondary" style={{
            backgroundColor: colors.secondary,
            color: colors.text
          }}>INFO</button>
        </div>

        <div className="preview-status" style={{
          borderLeft: `4px solid ${colors.accent}`,
          color: colors.text
        }}>
          <span className="status-label">Balance:</span>
          <span className="status-value" style={{ color: colors.success }}>
            $50.00
          </span>
        </div>

        <div className="preview-footer">
          ↑↓ Navigate · Enter Select · ESC Back
        </div>
      </div>
    </div>
  );
};
