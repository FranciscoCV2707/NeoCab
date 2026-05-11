import React, { useState, useCallback } from 'react';
import { ColorPickerSection } from './ColorPickerSection';
import { SliderSection, type SliderConfig } from './SliderSection';
import { MediaSettingsSection } from './MediaSettingsSection';
import { ThemePreview } from './ThemePreview';
import './ThemeEditor.css';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  success: string;
  error: string;
}

interface WheelSettings {
  item_size: number;
  item_spacing: number;
  animation_duration: number;
  selected_color: string;
  unselected_color: string;
}

interface MediaSettings {
  show_wheels: boolean;
  show_box_art: boolean;
  show_backgrounds: boolean;
  background_opacity: number;
  wheel_size: number;
}

interface ThemeData {
  name: string;
  author: string;
  version: string;
  colors: ThemeColors;
  wheel: WheelSettings;
  media: MediaSettings;
}

interface ThemeEditorProps {
  initialTheme?: ThemeData;
  onSave?: (theme: ThemeData) => Promise<void>;
  onCancel?: () => void;
}

const wheelSliders: SliderConfig[] = [
  { key: 'item_size', label: 'Item Size', min: 40, max: 150, step: 10, unit: 'px' },
  { key: 'item_spacing', label: 'Item Spacing', min: 10, max: 60, step: 5, unit: 'px' },
  { key: 'animation_duration', label: 'Animation Duration', min: 200, max: 1000, step: 50, unit: 'ms' },
];

const defaultTheme: ThemeData = {
  name: 'Custom Theme',
  author: 'User',
  version: '1.0',
  colors: {
    primary: '#FF6400',
    secondary: '#404040',
    accent: '#FFCC00',
    text: '#FFFFFF',
    background: '#1a1a1a',
    success: '#00FF64',
    error: '#FF3333',
  },
  wheel: {
    item_size: 80,
    item_spacing: 15,
    animation_duration: 400,
    selected_color: '#FFCC00',
    unselected_color: '#666666',
  },
  media: {
    show_wheels: true,
    show_box_art: true,
    show_backgrounds: true,
    background_opacity: 0.7,
    wheel_size: 300,
  },
};

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
  initialTheme = defaultTheme,
  onSave,
  onCancel,
}) => {
  const [theme, setTheme] = useState<ThemeData>(initialTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleColorChange = useCallback((colorKey: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  }, []);

  const handleWheelChange = useCallback((key: string, value: number) => {
    setTheme(prev => ({
      ...prev,
      wheel: {
        ...prev.wheel,
        [key]: value,
      },
    }));
  }, []);

  const handleColorSettingChange = useCallback((key: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      wheel: {
        ...prev.wheel,
        [key]: value,
      },
    }));
  }, []);

  const handleMediaChange = useCallback((key: keyof MediaSettings, value: any) => {
    setTheme(prev => ({
      ...prev,
      media: {
        ...prev.media,
        [key]: value,
      },
    }));
  }, []);

  const handleMetadataChange = useCallback((field: 'name' | 'author' | 'version', value: string) => {
    setTheme(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      if (onSave) {
        await onSave(theme);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="theme-editor">
      <div className="editor-header">
        <h2>Theme Editor</h2>
        <div className="metadata-inputs">
          <input
            type="text"
            placeholder="Theme Name"
            value={theme.name}
            onChange={(e) => handleMetadataChange('name', e.target.value)}
            className="metadata-input"
          />
          <input
            type="text"
            placeholder="Author"
            value={theme.author}
            onChange={(e) => handleMetadataChange('author', e.target.value)}
            className="metadata-input"
          />
          <input
            type="text"
            placeholder="Version"
            value={theme.version}
            onChange={(e) => handleMetadataChange('version', e.target.value)}
            className="metadata-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="editor-content">
        <div className="editor-panels">
          <ColorPickerSection
            title="Colors"
            colors={theme.colors}
            onChange={handleColorChange}
          />

          <SliderSection
            title="Wheel Settings"
            sliders={wheelSliders}
            values={theme.wheel}
            onChange={handleWheelChange}
          />

          <div className="color-settings-section">
            <h3 className="section-title">Wheel Colors</h3>
            <div className="color-grid">
              <div className="color-item">
                <label>Selected Item</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.wheel.selected_color}
                    onChange={(e) => handleColorSettingChange('selected_color', e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={theme.wheel.selected_color}
                    onChange={(e) => handleColorSettingChange('selected_color', e.target.value)}
                    className="color-hex"
                  />
                </div>
                <div
                  className="color-preview"
                  style={{ backgroundColor: theme.wheel.selected_color }}
                />
              </div>

              <div className="color-item">
                <label>Unselected Item</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.wheel.unselected_color}
                    onChange={(e) => handleColorSettingChange('unselected_color', e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={theme.wheel.unselected_color}
                    onChange={(e) => handleColorSettingChange('unselected_color', e.target.value)}
                    className="color-hex"
                  />
                </div>
                <div
                  className="color-preview"
                  style={{ backgroundColor: theme.wheel.unselected_color }}
                />
              </div>
            </div>
          </div>

          <MediaSettingsSection
            settings={theme.media}
            onChange={handleMediaChange}
          />
        </div>

        <div className="editor-preview">
          <ThemePreview colors={theme.colors} isLive={true} />
        </div>
      </div>

      <div className="editor-footer">
        <button
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  );
};

export default ThemeEditor;
