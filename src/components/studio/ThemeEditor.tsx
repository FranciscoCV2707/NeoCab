import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './ThemeEditor.css';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  surface: string;
  border: string;
  highlight: string;
  success: string;
  warning: string;
  error: string;
}

interface ThemeFonts {
  ui: string;
  title: string;
  subtitle: string;
  mono: string;
}

interface ThemeLayout {
  system_view: string;
  game_view: string;
  wheel_style: string;
  transition: string;
  animation_speed: number;
  easing: string;
}

interface ThemeMedia {
  video_enabled: boolean;
  video_loop: boolean;
  snap_type: string;
  marquee_enabled: boolean;
  wheel_enabled: boolean;
  box_art_enabled: boolean;
}

interface ThemeSounds {
  navigate: string;
  select: string;
  back: string;
  coin: string;
  start: string;
}

interface ThemeEffects {
  scanlines: boolean;
  crt_curve: number;
  glow_intensity: number;
  shadow_enabled: boolean;
}

interface ThemeData {
  name: string;
  author: string;
  version: string;
  description: string;
  style: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
  media: ThemeMedia;
  sounds: ThemeSounds;
  effects: ThemeEffects;
}

const defaultColors: ThemeColors = {
  primary: '#ff6b00',
  secondary: '#1a1a1a',
  accent: '#00ffcc',
  text: '#ffffff',
  background: '#0d0d0d',
  surface: '#1a1a1a',
  border: '#ff6b00',
  highlight: '#ff8c00',
  success: '#00ff00',
  warning: '#ffcc00',
  error: '#ff0000',
};

const defaultFonts: ThemeFonts = {
  ui: 'Arial',
  title: 'Impact',
  subtitle: 'Arial',
  mono: 'Consolas',
};

const defaultLayout: ThemeLayout = {
  system_view: 'carousel',
  game_view: 'split',
  wheel_style: '3d',
  transition: 'slide',
  animation_speed: 300,
  easing: 'easeOutCubic',
};

const defaultMedia: ThemeMedia = {
  video_enabled: true,
  video_loop: true,
  snap_type: 'video',
  marquee_enabled: true,
  wheel_enabled: true,
  box_art_enabled: true,
};

const defaultSounds: ThemeSounds = {
  navigate: 'nav.wav',
  select: 'select.wav',
  back: 'back.wav',
  coin: 'coin.wav',
  start: 'start.wav',
};

const defaultEffects: ThemeEffects = {
  scanlines: false,
  crt_curve: 0,
  glow_intensity: 0.5,
  shadow_enabled: true,
};

const themePresets: Record<string, Partial<ThemeData>> = {
  'arcade-classic': {
    name: 'Arcade Classic',
    style: 'arcade',
    description: 'Classic 80s arcade cabinet aesthetic with neon glow',
    colors: { ...defaultColors },
    layout: { ...defaultLayout, system_view: 'carousel', wheel_style: '3d' },
    effects: { ...defaultEffects, glow_intensity: 0.7, shadow_enabled: true },
  },
  'neon-future': {
    name: 'Neon Future',
    style: 'neon',
    description: 'Vibrant neon colors with gradients and glow effects',
    colors: {
      primary: '#ff00ff',
      secondary: '#0d0d0d',
      accent: '#00ffff',
      text: '#ffffff',
      background: '#0a0a0a',
      surface: '#1a0a1a',
      border: '#ff00ff',
      highlight: '#00ffff',
      success: '#00ff00',
      warning: '#ffcc00',
      error: '#ff0066',
    },
    layout: { ...defaultLayout, system_view: 'grid', wheel_style: 'flat' },
    effects: { ...defaultEffects, glow_intensity: 1.0, scanlines: false },
  },
  'minimal-clean': {
    name: 'Minimal Clean',
    style: 'minimal',
    description: 'Clean, modern, flat design with subtle accents',
    colors: {
      primary: '#0078d4',
      secondary: '#f5f5f5',
      accent: '#00b7c3',
      text: '#333333',
      background: '#ffffff',
      surface: '#f0f0f0',
      border: '#e0e0e0',
      highlight: '#0078d4',
      success: '#107c10',
      warning: '#ff8c00',
      error: '#d13438',
    },
    layout: { ...defaultLayout, system_view: 'list', wheel_style: 'flat', animation_speed: 200, easing: 'linear' },
    effects: { ...defaultEffects, glow_intensity: 0, shadow_enabled: false, scanlines: false },
  },
  'retro-crt': {
    name: 'Retro CRT',
    style: 'crt',
    description: 'Authentic CRT monitor effect with scanlines and curvature',
    colors: {
      primary: '#33ff33',
      secondary: '#0d1a0d',
      accent: '#00ff00',
      text: '#33ff33',
      background: '#050a05',
      surface: '#0d1a0d',
      border: '#33ff33',
      highlight: '#66ff66',
      success: '#33ff33',
      warning: '#ffff33',
      error: '#ff3333',
    },
    layout: { ...defaultLayout, system_view: 'carousel', wheel_style: '3d' },
    effects: { ...defaultEffects, scanlines: true, crt_curve: 0.3, glow_intensity: 0.3 },
  },
  'cyberpunk': {
    name: 'Cyberpunk',
    style: 'cyberpunk',
    description: 'Dark theme with neon accents and glitch effects',
    colors: {
      primary: '#ff006e',
      secondary: '#0d0d0d',
      accent: '#8338ec',
      text: '#ffffff',
      background: '#0a0a0a',
      surface: '#1a0a1a',
      border: '#ff006e',
      highlight: '#8338ec',
      success: '#00ff00',
      warning: '#ffcc00',
      error: '#ff006e',
    },
    layout: { ...defaultLayout, system_view: 'grid', wheel_style: 'flat', transition: 'glitch' },
    effects: { ...defaultEffects, glow_intensity: 0.8, scanlines: true, crt_curve: 0.1 },
  },
};

type EditorTab = 'colors' | 'fonts' | 'layout' | 'media' | 'sounds' | 'effects' | 'preview';

export const ThemeEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [theme, setTheme] = useState<ThemeData>({
    name: 'Custom Theme',
    author: 'NeoCab User',
    version: '1.0.0',
    description: 'A custom theme',
    style: 'custom',
    colors: { ...defaultColors },
    fonts: { ...defaultFonts },
    layout: { ...defaultLayout },
    media: { ...defaultMedia },
    sounds: { ...defaultSounds },
    effects: { ...defaultEffects },
  });
  const [themes, setThemes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const result = await invoke<string>('list_themes');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setThemes(parsed.themes.map((t: any) => t.name));
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = themePresets[presetKey];
    if (preset) {
      setTheme(prev => ({
        ...prev,
        name: preset.name || prev.name,
        style: preset.style || prev.style,
        description: preset.description || prev.description,
        colors: { ...prev.colors, ...(preset.colors || {}) },
        layout: { ...prev.layout, ...(preset.layout || {}) },
        effects: { ...prev.effects, ...(preset.effects || {}) },
      }));
      setMessage(`Preset "${preset.name}" applied`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateFont = (key: keyof ThemeFonts, value: string) => {
    setTheme(prev => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }));
  };

  const updateLayout = (key: keyof ThemeLayout, value: string | number) => {
    setTheme(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: value },
    }));
  };

  const updateMedia = (key: keyof ThemeMedia, value: boolean | string) => {
    setTheme(prev => ({
      ...prev,
      media: { ...prev.media, [key]: value },
    }));
  };

  const updateEffects = (key: keyof ThemeEffects, value: boolean | number) => {
    setTheme(prev => ({
      ...prev,
      effects: { ...prev.effects, [key]: value },
    }));
  };

  const saveTheme = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const themeJson = JSON.stringify(theme);
      const result = await invoke<string>('save_custom_theme', { theme: themeJson });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setMessage(`Theme "${parsed.theme_name}" saved successfully!`);
        await loadThemes();
      } else {
        setMessage(`Error: ${parsed.error}`);
      }
    } catch (err: any) {
      setMessage(`Error saving theme: ${err}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const loadTheme = async (name: string) => {
    try {
      const result = await invoke<string>('load_theme', { name });
      const parsed = JSON.parse(result);
      if (parsed.success && parsed.theme) {
        setTheme(parsed.theme);
        setMessage(`Theme "${name}" loaded`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage(`Error loading theme: ${err}`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const applyTheme = async (name: string) => {
    try {
      const result = await invoke<string>('apply_theme', { name });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setMessage(`Theme "${name}" applied! UI will update momentarily.`);
      } else {
        setMessage(`Error: ${parsed.error}`);
      }
    } catch (err) {
      setMessage(`Error applying theme: ${err}`);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const exportTheme = async () => {
    try {
      const result = await invoke<string>('export_theme', { name: theme.name });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setMessage(`Theme exported to: ${parsed.export_path}`);
      }
    } catch (err) {
      setMessage(`Error exporting theme: ${err}`);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'colors', label: 'Colors' },
    { key: 'fonts', label: 'Fonts' },
    { key: 'layout', label: 'Layout' },
    { key: 'media', label: 'Media' },
    { key: 'sounds', label: 'Sounds' },
    { key: 'effects', label: 'Effects' },
    { key: 'preview', label: 'Preview' },
  ];

  const renderColors = () => (
    <div className="editor-section">
      <h3>Theme Colors</h3>
      <p className="section-desc">Define the color palette for your theme</p>
      <div className="color-grid">
        {Object.entries(theme.colors).map(([key, value]) => (
          <div key={key} className="color-item">
            <label>{key.replace('_', ' ')}</label>
            <div className="color-input-row">
              <input
                type="color"
                value={value}
                onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                className="color-text-input"
              />
            </div>
            <div className="color-preview" style={{ backgroundColor: value }} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderFonts = () => (
    <div className="editor-section">
      <h3>Theme Fonts</h3>
      <p className="section-desc">Choose fonts for different UI elements</p>
      <div className="font-list">
        {Object.entries(theme.fonts).map(([key, value]) => (
          <div key={key} className="font-item">
            <label>{key}</label>
            <select
              value={value}
              onChange={(e) => updateFont(key as keyof ThemeFonts, e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Impact">Impact</option>
              <option value="Consolas">Consolas</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
            <span className="font-preview" style={{ fontFamily: value }}>
              The quick brown fox
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLayout = () => (
    <div className="editor-section">
      <h3>Layout Settings</h3>
      <p className="section-desc">Configure view styles and animations</p>
      <div className="setting-list">
        <div className="setting-item">
          <label>System View Style</label>
          <select value={theme.layout.system_view} onChange={(e) => updateLayout('system_view', e.target.value)}>
            <option value="carousel">Carousel 3D</option>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Game View Style</label>
          <select value={theme.layout.game_view} onChange={(e) => updateLayout('game_view', e.target.value)}>
            <option value="split">Split Panel</option>
            <option value="full">Full Preview</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Wheel Style</label>
          <select value={theme.layout.wheel_style} onChange={(e) => updateLayout('wheel_style', e.target.value)}>
            <option value="3d">3D Wheel</option>
            <option value="flat">Flat</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Transition Type</label>
          <select value={theme.layout.transition} onChange={(e) => updateLayout('transition', e.target.value)}>
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
            <option value="scale">Scale</option>
            <option value="flip">Flip</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Easing Function</label>
          <select value={theme.layout.easing} onChange={(e) => updateLayout('easing', e.target.value)}>
            <option value="linear">Linear</option>
            <option value="easeOutCubic">Ease Out Cubic</option>
            <option value="easeOutQuad">Ease Out Quad</option>
            <option value="easeOutBounce">Ease Out Bounce</option>
            <option value="easeOutBack">Ease Out Back</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Animation Speed (ms)</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={theme.layout.animation_speed}
            onChange={(e) => updateLayout('animation_speed', Number(e.target.value))}
          />
          <span>{theme.layout.animation_speed}ms</span>
        </div>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="editor-section">
      <h3>Media Settings</h3>
      <p className="section-desc">Configure video, images, and artwork display</p>
      <div className="setting-list">
        <div className="setting-item toggle">
          <label>Video Preview</label>
          <input
            type="checkbox"
            checked={theme.media.video_enabled}
            onChange={(e) => updateMedia('video_enabled', e.target.checked)}
          />
        </div>
        <div className="setting-item toggle">
          <label>Video Loop</label>
          <input
            type="checkbox"
            checked={theme.media.video_loop}
            onChange={(e) => updateMedia('video_loop', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>Snap Type</label>
          <select value={theme.media.snap_type} onChange={(e) => updateMedia('snap_type', e.target.value)}>
            <option value="video">Video</option>
            <option value="screenshot">Screenshot</option>
            <option value="title">Title Screen</option>
          </select>
        </div>
        <div className="setting-item toggle">
          <label>Marquee Display</label>
          <input
            type="checkbox"
            checked={theme.media.marquee_enabled}
            onChange={(e) => updateMedia('marquee_enabled', e.target.checked)}
          />
        </div>
        <div className="setting-item toggle">
          <label>Game Wheel</label>
          <input
            type="checkbox"
            checked={theme.media.wheel_enabled}
            onChange={(e) => updateMedia('wheel_enabled', e.target.checked)}
          />
        </div>
        <div className="setting-item toggle">
          <label>Box Art</label>
          <input
            type="checkbox"
            checked={theme.media.box_art_enabled}
            onChange={(e) => updateMedia('box_art_enabled', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderSounds = () => (
    <div className="editor-section">
      <h3>Sound Settings</h3>
      <p className="section-desc">Assign sound effects to UI actions</p>
      <div className="setting-list">
        {Object.entries(theme.sounds).map(([key, value]) => (
          <div key={key} className="setting-item">
            <label>{key.replace('_', ' ')}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setTheme(prev => ({
                ...prev,
                sounds: { ...prev.sounds, [key]: e.target.value }
              }))}
              placeholder="sound.wav"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className="editor-section">
      <h3>Visual Effects</h3>
      <p className="section-desc">Configure post-processing effects</p>
      <div className="setting-list">
        <div className="setting-item toggle">
          <label>Scanlines</label>
          <input
            type="checkbox"
            checked={theme.effects.scanlines}
            onChange={(e) => updateEffects('scanlines', e.target.checked)}
          />
        </div>
        <div className="setting-item toggle">
          <label>Drop Shadows</label>
          <input
            type="checkbox"
            checked={theme.effects.shadow_enabled}
            onChange={(e) => updateEffects('shadow_enabled', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>CRT Curve Intensity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={theme.effects.crt_curve}
            onChange={(e) => updateEffects('crt_curve', Number(e.target.value))}
          />
          <span>{Math.round(theme.effects.crt_curve * 100)}%</span>
        </div>
        <div className="setting-item">
          <label>Glow Intensity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={theme.effects.glow_intensity}
            onChange={(e) => updateEffects('glow_intensity', Number(e.target.value))}
          />
          <span>{Math.round(theme.effects.glow_intensity * 100)}%</span>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="editor-section preview-section">
      <h3>Theme Preview</h3>
      <p className="section-desc">See how your theme will look</p>
      <div
        className="preview-container"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontFamily: theme.fonts.ui,
        }}
      >
        <div className="preview-header" style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
          <h1 style={{ color: theme.colors.primary, textShadow: theme.effects.glow_intensity > 0 ? `0 0 20px ${theme.colors.primary}` : 'none' }}>
            NeoCab
          </h1>
          <span style={{ color: theme.colors.accent }}>Preview Mode</span>
        </div>
        <div className="preview-content">
          <div className="preview-sidebar" style={{ backgroundColor: theme.colors.surface }}>
            {['System 1', 'System 2', 'System 3'].map((sys, i) => (
              <div
                key={sys}
                className="preview-system-item"
                style={{
                  borderLeft: i === 0 ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                  backgroundColor: i === 0 ? theme.colors.surface : 'transparent',
                  color: i === 0 ? theme.colors.primary : theme.colors.text,
                }}
              >
                {sys}
              </div>
            ))}
          </div>
          <div className="preview-main">
            <div className="preview-video" style={{ backgroundColor: theme.colors.secondary }}>
              <span>Video Preview Area</span>
            </div>
            <div className="preview-game-list" style={{ backgroundColor: theme.colors.surface }}>
              {['Game One', 'Game Two', 'Game Three', 'Game Four'].map((game, i) => (
                <div
                  key={game}
                  className="preview-game-item"
                  style={{
                    backgroundColor: i === 0 ? theme.colors.primary : 'transparent',
                    color: i === 0 ? theme.colors.background : theme.colors.text,
                  }}
                >
                  {game}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="preview-footer" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          <span>Credits: 5</span>
          <span>Timer: 3:00</span>
          <span>12:00 PM</span>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'colors': return renderColors();
      case 'fonts': return renderFonts();
      case 'layout': return renderLayout();
      case 'media': return renderMedia();
      case 'sounds': return renderSounds();
      case 'effects': return renderEffects();
      case 'preview': return renderPreview();
      default: return null;
    }
  };

  return (
    <div className="theme-editor">
      <div className="editor-header">
        <h2>Theme Editor</h2>
        <div className="editor-actions">
          <select onChange={(e) => e.target.value && applyPreset(e.target.value)} defaultValue="">
            <option value="" disabled>Load preset...</option>
            {Object.entries(themePresets).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
          </select>
          <select onChange={(e) => e.target.value && loadTheme(e.target.value)} defaultValue="">
            <option value="" disabled>Load saved theme...</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-export" onClick={exportTheme}>Export</button>
          <button className="btn-save" onClick={saveTheme} disabled={saving}>
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      {message && <div className="editor-message">{message}</div>}

      <div className="editor-body">
        <div className="editor-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="editor-content">
          {renderTabContent()}
        </div>
      </div>

      <div className="editor-footer">
        <div className="theme-info">
          <label>Name:</label>
          <input
            type="text"
            value={theme.name}
            onChange={(e) => setTheme(prev => ({ ...prev, name: e.target.value }))}
          />
          <label>Author:</label>
          <input
            type="text"
            value={theme.author}
            onChange={(e) => setTheme(prev => ({ ...prev, author: e.target.value }))}
          />
          <label>Version:</label>
          <input
            type="text"
            value={theme.version}
            onChange={(e) => setTheme(prev => ({ ...prev, version: e.target.value }))}
            style={{ width: '80px' }}
          />
        </div>
        {themes.length > 0 && (
          <div className="apply-theme">
            <label>Apply theme:</label>
            <select onChange={(e) => e.target.value && applyTheme(e.target.value)} defaultValue="">
              <option value="" disabled>Select...</option>
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
