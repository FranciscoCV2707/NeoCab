import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './ThemeEditor.css';

interface ThemeInfo {
  id: number;
  name: string;
  path: string;
}

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
  background_image: string;
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
  background_image: '',
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
        setThemes(parsed.themes.map((t: ThemeInfo) => t.name));
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(`Error saving theme: ${message}`);
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
      <h3>Diseño y Navegación</h3>
      <p className="section-desc">Elige cómo se muestran los sistemas y los juegos</p>

      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Vista de Sistemas</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { value: 'carousel', label: 'Carrusel 3D', desc: 'Rueda giratoria', diagram: '◀ ① ② ③ ▶' },
          { value: 'grid',    label: 'Cuadrícula',  desc: 'Mosaico de iconos', diagram: '▣ ▣\n▣ ▣' },
          { value: 'list',    label: 'Lista',        desc: 'Vertical simple',  diagram: '━━━━\n━━━━\n━━━━' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => updateLayout('system_view', opt.value)}
            style={{
              flex: '1 1 120px',
              padding: '10px 8px',
              border: `2px solid ${theme.layout.system_view === opt.value ? theme.colors.primary : '#444'}`,
              borderRadius: 8,
              background: theme.layout.system_view === opt.value ? `${theme.colors.primary}22` : '#1a1a2e',
              color: theme.layout.system_view === opt.value ? theme.colors.primary : '#ccc',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4, whiteSpace: 'pre', lineHeight: 1.3 }}>{opt.diagram}</div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{opt.label}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Vista de Juegos</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { value: 'split',   label: 'Dividida',   desc: 'Lista + preview', diagram: '▌  ▌▐  ▐' },
          { value: 'full',    label: 'Completa',   desc: 'Imagen grande',   diagram: '▓▓▓▓▓\n▓▓▓▓▓' },
          { value: 'compact', label: 'Compacta',   desc: 'Solo lista densa', diagram: '━━━━\n━━━━\n━━━━\n━━━━' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => updateLayout('game_view', opt.value)}
            style={{
              flex: '1 1 120px',
              padding: '10px 8px',
              border: `2px solid ${theme.layout.game_view === opt.value ? theme.colors.accent : '#444'}`,
              borderRadius: 8,
              background: theme.layout.game_view === opt.value ? `${theme.colors.accent}22` : '#1a1a2e',
              color: theme.layout.game_view === opt.value ? theme.colors.accent : '#ccc',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 4, whiteSpace: 'pre', lineHeight: 1.3 }}>{opt.diagram}</div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{opt.label}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <div className="setting-list">
        <div className="setting-item">
          <label>Estilo del Wheel</label>
          <select value={theme.layout.wheel_style} onChange={(e) => updateLayout('wheel_style', e.target.value)}>
            <option value="3d">3D Wheel</option>
            <option value="flat">Plano</option>
            <option value="hidden">Oculto</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Tipo de Transición</label>
          <select value={theme.layout.transition} onChange={(e) => updateLayout('transition', e.target.value)}>
            <option value="slide">Deslizar</option>
            <option value="fade">Fundido</option>
            <option value="scale">Escalar</option>
            <option value="flip">Voltear</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Velocidad ({theme.layout.animation_speed}ms)</label>
          <input
            type="range" min="100" max="1000" step="50"
            value={theme.layout.animation_speed}
            onChange={(e) => updateLayout('animation_speed', Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="editor-section">
      <h3>Imágenes y Multimedia</h3>
      <p className="section-desc">Configura vídeo, imágenes y artwork de los juegos</p>
      <div className="setting-list">
        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <label style={{ fontWeight: 600 }}>Imagen de fondo personalizada</label>
          <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
            Ruta a una imagen (.jpg, .png, .webp) que se usará como fondo de pantalla.
          </p>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              type="text"
              value={theme.media.background_image}
              onChange={(e) => updateMedia('background_image', e.target.value)}
              placeholder="C:\Users\...\fondo.jpg  o  ./media/bg.jpg"
              style={{ flex: 1, padding: '5px 8px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 12 }}
            />
            {theme.media.background_image && (
              <button
                onClick={() => updateMedia('background_image', '')}
                style={{ padding: '4px 8px', background: '#522', border: '1px solid #f66', borderRadius: 4, color: '#eee', cursor: 'pointer', fontSize: 12 }}
              >
                Quitar
              </button>
            )}
          </div>
          {theme.media.background_image && (
            <p style={{ fontSize: 11, color: '#4af', margin: 0 }}>
              La imagen se aplicará como fondo al guardar el tema.
            </p>
          )}
        </div>
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
      {/* ── Header ── */}
      <div className="editor-header">
        <h2>Editor de Temas</h2>
        <div className="editor-actions">
          <select onChange={(e) => e.target.value && applyPreset(e.target.value)} defaultValue="" title="Cargar preset predefinido">
            <option value="" disabled>Preset...</option>
            {Object.entries(themePresets).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
          </select>
          <select onChange={(e) => e.target.value && loadTheme(e.target.value)} defaultValue="" title="Cargar tema guardado">
            <option value="" disabled>Cargar guardado...</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-export" onClick={exportTheme} title="Exportar tema como archivo">Exportar</button>
          <button className="btn-save" onClick={saveTheme} disabled={saving} title="Guardar tema en disco">
            {saving ? 'Guardando...' : 'Guardar tema'}
          </button>
        </div>
      </div>

      {message && <div className="editor-message">{message}</div>}

      {/* ── Body: editor left + live preview right ── */}
      <div className="editor-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Left: tabs + content */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="editor-tabs">
            {tabs.filter(tab => tab.key !== 'preview').map(tab => (
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
            {activeTab !== 'preview' && renderTabContent()}
          </div>
        </div>

        {/* Right: always-on live preview */}
        <div style={{ flex: '0 0 300px', position: 'sticky', top: 0 }}>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, textAlign: 'center' }}>Vista previa en tiempo real</p>
          <div
            style={{
              backgroundColor: theme.colors.background,
              backgroundImage: theme.media.background_image ? `url(${theme.media.background_image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: theme.colors.text,
              fontFamily: theme.fonts.ui,
              borderRadius: 8,
              overflow: 'hidden',
              border: `2px solid ${theme.colors.border}`,
              fontSize: 11,
            }}
          >
            {/* Preview header */}
            <div style={{ padding: '8px 12px', borderBottom: `2px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', background: `${theme.colors.surface}cc` }}>
              <span style={{ color: theme.colors.primary, fontFamily: theme.fonts.title, fontWeight: 700, fontSize: 14, textShadow: theme.effects.glow_intensity > 0 ? `0 0 8px ${theme.colors.primary}` : 'none' }}>
                NeoCab
              </span>
              <span style={{ color: theme.colors.accent }}>Modo Preview</span>
            </div>

            {/* Preview body */}
            <div style={{ display: 'flex', height: 180 }}>
              {/* Sidebar */}
              <div style={{ width: 90, background: `${theme.colors.surface}dd`, borderRight: `1px solid ${theme.colors.border}`, padding: 6 }}>
                {['MAME', 'SNES', 'NES', 'PS1'].map((sys, i) => (
                  <div key={sys} style={{
                    padding: '4px 6px', marginBottom: 2, borderRadius: 3, fontSize: 10,
                    background: i === 0 ? theme.colors.primary : 'transparent',
                    color: i === 0 ? theme.colors.background : theme.colors.text,
                    borderLeft: i !== 0 ? `2px solid ${theme.colors.border}` : 'none',
                  }}>
                    {sys}
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: `${theme.colors.secondary}aa`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ opacity: 0.4 }}>Preview</span>
                </div>
                <div style={{ background: `${theme.colors.surface}cc` }}>
                  {['Street Fighter II', 'Pac-Man', 'Donkey Kong'].map((game, i) => (
                    <div key={game} style={{
                      padding: '3px 8px', fontSize: 10,
                      background: i === 0 ? `${theme.colors.accent}33` : 'transparent',
                      color: i === 0 ? theme.colors.accent : theme.colors.text,
                      borderLeft: i === 0 ? `2px solid ${theme.colors.accent}` : 'none',
                    }}>
                      {game}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview footer */}
            <div style={{ padding: '4px 12px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', background: `${theme.colors.surface}cc`, opacity: 0.8 }}>
              <span>Créditos: 5</span>
              <span>3:00</span>
              <span style={{ color: theme.colors.success }}>OK</span>
            </div>
          </div>

          {/* Quick color swatches */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {Object.entries(theme.colors).slice(0, 6).map(([key, val]) => (
              <div key={key} title={key} style={{ width: 20, height: 20, borderRadius: 4, background: val, border: '1px solid #333', cursor: 'pointer' }} />
            ))}
          </div>

          {/* Footer actions here too */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={theme.name}
                onChange={(e) => setTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del tema"
                style={{ flex: 1, padding: '4px 6px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 11 }}
              />
            </div>
            {themes.length > 0 && (
              <select onChange={(e) => e.target.value && applyTheme(e.target.value)} defaultValue=""
                style={{ width: '100%', padding: '4px 6px', background: '#1a1a2e', border: '1px solid #4af', borderRadius: 4, color: '#eee', fontSize: 11 }}>
                <option value="" disabled>Aplicar tema guardado...</option>
                {themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
