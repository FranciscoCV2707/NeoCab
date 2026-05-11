import React from 'react';
import './MediaSettingsSection.css';

interface MediaSettings {
  show_wheels: boolean;
  show_box_art: boolean;
  show_backgrounds: boolean;
  background_opacity: number;
  wheel_size: number;
}

interface MediaSettingsSectionProps {
  settings: MediaSettings;
  onChange: (key: keyof MediaSettings, value: any) => void;
}

export const MediaSettingsSection: React.FC<MediaSettingsSectionProps> = ({
  settings,
  onChange
}) => {
  return (
    <div className="media-settings-section">
      <h3 className="section-title">Media Settings</h3>

      <div className="media-toggles">
        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.show_wheels}
            onChange={(e) => onChange('show_wheels', e.target.checked)}
          />
          <span>Show Wheel Images</span>
        </label>

        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.show_box_art}
            onChange={(e) => onChange('show_box_art', e.target.checked)}
          />
          <span>Show Box Art</span>
        </label>

        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.show_backgrounds}
            onChange={(e) => onChange('show_backgrounds', e.target.checked)}
          />
          <span>Show Backgrounds</span>
        </label>
      </div>

      <div className="media-sliders">
        <div className="slider-item">
          <div className="slider-header">
            <label>Background Opacity</label>
            <span className="slider-value">{Math.round(settings.background_opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.background_opacity}
            onChange={(e) => onChange('background_opacity', parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>

        <div className="slider-item">
          <div className="slider-header">
            <label>Wheel Size</label>
            <span className="slider-value">{Math.round(settings.wheel_size)}px</span>
          </div>
          <input
            type="range"
            min="100"
            max="500"
            step="10"
            value={settings.wheel_size}
            onChange={(e) => onChange('wheel_size', parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>
      </div>
    </div>
  );
};
