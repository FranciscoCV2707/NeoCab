import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { injectThemeCss, Theme, useThemeStore, type SkinId, type ComposeMap, type WidgetLayout } from '../../stores/useThemeStore';
import { ThemeAIHelper } from './ThemeAIHelper';
import { ThemeSDKManual } from './ThemeSDKManual';
import { LayoutEditor } from './LayoutEditor';
import { SkinPreview } from './SkinPreview';
import { DEFAULT_COMPOSE } from '../../themes/ComposedSkin';
import { THEME_REGISTRY } from '../../themes/registry';
import type { ThemeScreens } from '../../types/layout';
import './ThemeEditor.css';

interface ThemeListItem {
  id: string;
  name: string;
  is_custom: boolean;
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
  [key: string]: string;
}

interface ThemeFonts {
  ui: string;
  title: string;
  subtitle: string;
  mono: string;
  google_font: string;
  [key: string]: string;
}

interface ThemeBackground {
  type: 'color' | 'gradient' | 'image' | 'video';
  color: string;
  gradient: string;
  image: string;
  video: string;
  opacity: number;
  blur: number;
  overlay_color: string;
}

interface ThemeWheel {
  item_size: number;
  item_spacing: number;
  animation_duration: number;
  selected_color: string;
  unselected_color: string;
  selected_scale: number;
  glow_selected: boolean;
}

interface ThemeOverlay {
  coin_position: string;
  timer_position: string;
  stats_opacity: number;
  animation_style: string;
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
  vignette: number;
  noise: number;
  blur_unselected: number;
}

interface ThemeData {
  name: string;
  author: string;
  version: string;
  description: string;
  style: string;
  skin?: SkinId;
  compose?: ComposeMap;
  widgets?: WidgetLayout;
  hw?: { base_hue: number; base_hue2: number };
  colors: ThemeColors;
  fonts: ThemeFonts;
  background: ThemeBackground;
  layout: ThemeLayout;
  wheel: ThemeWheel;
  media: ThemeMedia;
  sounds: ThemeSounds;
  effects: ThemeEffects;
  overlay: ThemeOverlay;
  screens?: ThemeScreens;
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
  google_font: '',
};

const defaultBackground: ThemeBackground = {
  type: 'color',
  color: '#0d0d0d',
  gradient: '',
  image: '',
  video: '',
  opacity: 1.0,
  blur: 0,
  overlay_color: '',
};

const defaultWheel: ThemeWheel = {
  item_size: 120,
  item_spacing: 15,
  animation_duration: 300,
  selected_color: '#ff6b00',
  unselected_color: '#444444',
  selected_scale: 1.15,
  glow_selected: true,
};

const defaultOverlay: ThemeOverlay = {
  coin_position: 'top-right',
  timer_position: 'bottom-right',
  stats_opacity: 0.8,
  animation_style: 'smooth',
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
  vignette: 0,
  noise: 0,
  blur_unselected: 0,
};

type EditorTab = 'colors' | 'fonts' | 'background' | 'layout' | 'media' | 'sounds' | 'effects' | 'compose';

const WHEEL_SYSTEMS = ['MAME', 'SNES', 'NES', 'PS1', 'N64', 'GBA'];
const WHEEL_GAMES = ['Street Fighter II', 'Pac-Man', 'Donkey Kong', 'Mortal Kombat'];

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
    background: { ...defaultBackground },
    layout: { ...defaultLayout },
    wheel: { ...defaultWheel },
    media: { ...defaultMedia },
    sounds: { ...defaultSounds },
    effects: { ...defaultEffects },
    overlay: { ...defaultOverlay },
  });
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [showSDKManual, setShowSDKManual] = useState(false);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [themeList, setThemeList] = useState<ThemeListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [previewSystem, setPreviewSystem] = useState(2);
  const [focusedColor, setFocusedColor] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'real' | 'sistema' | 'menu'>('real');
  const [compose, setCompose] = useState<ComposeMap | null>(null);
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [importPath, setImportPath] = useState('');
  const [showImportInput, setShowImportInput] = useState(false);
  const [currentThemeIsCustom, setCurrentThemeIsCustom] = useState(false);
  const colorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { loadThemeList(); }, []);

  // Hydrate the editor from the active theme so editing starts from the live
  // skin's native colors/hue (not generic defaults) and saving never clobbers
  // the active skin's look unless the user changes it.
  const storeTheme = useThemeStore(s => s.currentTheme);
  useEffect(() => {
    if (!storeTheme) return;
    setTheme(prev => ({
      ...prev,
      name: prev.name === 'Custom Theme' ? `${storeTheme.name} (custom)` : prev.name,
      skin: (storeTheme.skin as SkinId) ?? prev.skin,
      hw: storeTheme.hw ?? prev.hw,
      colors: { ...defaultColors, ...prev.colors, ...storeTheme.colors },
      fonts: { ...prev.fonts, ...storeTheme.fonts },
      effects: { ...prev.effects, ...storeTheme.effects },
    }));
    if (storeTheme.compose) setCompose(storeTheme.compose);
    if (storeTheme.widgets) setWidgetLayout(storeTheme.widgets);
    // Only on the first mount with a theme available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMsg = (text: string, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadThemeList = async () => {
    try {
      const result = await invoke<string>('list_themes');
      const parsed = JSON.parse(result);
      if (parsed.success) {
        setThemeList(
          (parsed.themes as { id: string; name: string; is_custom?: boolean }[]).map(t => ({
            id: t.id,
            name: t.name,
            is_custom: t.is_custom ?? false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load theme list:', err);
    }
  };

  const loadThemeById = async (id: string) => {
    try {
      const result = await invoke<string>('load_theme', { name: id });
      const parsed = JSON.parse(result);
      if (parsed.success && parsed.theme) {
        const t = parsed.theme;
        setTheme({
          name: t.name,
          author: t.author || '',
          version: t.version || '1.0.0',
          description: t.description || '',
          style: t.style || 'custom',
          colors: { ...defaultColors, ...t.colors },
          fonts: { ...defaultFonts, ...t.fonts },
          background: { ...defaultBackground, ...(t.background || {}) },
          layout: { ...defaultLayout, ...t.layout },
          wheel: { ...defaultWheel, ...(t.wheel || {}) },
          media: { ...defaultMedia, ...t.media },
          sounds: { ...defaultSounds, ...t.sounds },
          effects: { ...defaultEffects, ...t.effects },
          overlay: { ...defaultOverlay, ...(t.overlay || {}) },
          screens: t.screens,
        });
        showMsg(`Tema "${t.name}" cargado`);
      } else {
        showMsg(`Error: ${parsed.error}`, false);
      }
    } catch (err) {
      showMsg(`Error cargando tema: ${err}`, false);
    }
  };

  const saveTheme = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // When a composition or widget layout is set, save as a 'composed' theme so
      // App.tsx renders the chosen skin per screen plus the widget overlay.
      const hasWidgets = !!widgetLayout && Object.values(widgetLayout).some(a => a && a.length > 0);
      const payload: ThemeData = (compose || hasWidgets)
        ? { ...theme, skin: 'composed', compose: compose ?? DEFAULT_COMPOSE, widgets: widgetLayout ?? undefined }
        : theme;
      const themeJson = JSON.stringify(payload);
      const result = await invoke<string>('save_custom_theme', { theme: themeJson });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        // Persist + apply through the store so the custom theme survives reload
        // and App.tsx routes to the right skin (currentTheme.skin).
        useThemeStore.getState().applyTheme(payload as unknown as Theme);
        await invoke('apply_theme', { name: parsed.theme_name }).catch(() => {});
        await loadThemeList();
        showMsg(`Tema "${parsed.theme_name}" guardado y aplicado`);
      } else {
        showMsg(`Error: ${parsed.error}`, false);
      }
    } catch (err) {
      showMsg(`Error guardando: ${err instanceof Error ? err.message : String(err)}`, false);
    } finally {
      setSaving(false);
    }
  };

  const loadThemeFromAI = (parsed: ThemeData) => {
    setTheme(parsed);
    setShowAIHelper(false);
    showMsg('Tema cargado desde IA — revisa y guarda');
  };

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim();
    if (!name) return;
    try {
      await invoke<string>('create_theme_from_template', { name });
      setShowTemplateInput(false);
      setNewTemplateName('');
      await loadThemeList();
      showMsg(`Tema "${name}" creado — ábrelo en tu editor de código`);
    } catch (err) {
      showMsg(`Error: ${err}`, false);
    }
  };

  const handleOpenFolder = async () => {
    const slug = theme.name.toLowerCase().replace(/\s+/g, '-');
    try {
      await invoke('open_theme_folder', { themeName: slug });
    } catch (err) {
      showMsg(`Error abriendo carpeta: ${err}`, false);
    }
  };

  const handleImportFolder = async () => {
    const path = importPath.trim();
    if (!path) return;
    try {
      const folderName = await invoke<string>('import_theme_folder', { folderPath: path });
      setShowImportInput(false);
      setImportPath('');
      await loadThemeList();
      showMsg(`Tema "${folderName}" importado`);
    } catch (err) {
      showMsg(`Error importando: ${err}`, false);
    }
  };

  const handleLoadCustomTheme = async (id: string) => {
    await loadThemeById(id);
    setCurrentThemeIsCustom(true);
  };

  const applyThemeById = async (id: string) => {
    try {
      const result = await invoke<string>('apply_theme', { name: id });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        injectThemeCss(theme as unknown as Theme);
        showMsg(`Tema aplicado al menú de sistemas`);
      } else {
        showMsg(`Error: ${parsed.error}`, false);
      }
    } catch (err) {
      showMsg(`Error aplicando: ${err}`, false);
    }
  };

  const exportTheme = async () => {
    try {
      const result = await invoke<string>('export_theme', { name: theme.name });
      const parsed = JSON.parse(result);
      if (parsed.success) {
        showMsg(`Exportado a: ${parsed.export_path}`);
      } else {
        showMsg(`Error: ${parsed.error}`, false);
      }
    } catch (err) {
      showMsg(`Error exportando: ${err}`, false);
    }
  };

  const jumpToColor = (key: string) => {
    setActiveTab('colors');
    setFocusedColor(key);
    // scroll after render
    setTimeout(() => {
      colorRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const updateColor = (key: keyof ThemeColors, value: string) =>
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));

  const updateHue = (key: 'base_hue' | 'base_hue2', value: number) =>
    setTheme(prev => ({
      ...prev,
      hw: { base_hue: prev.hw?.base_hue ?? 35, base_hue2: prev.hw?.base_hue2 ?? 200, [key]: value },
    }));

  const updateFont = (key: keyof ThemeFonts, value: string) =>
    setTheme(prev => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));

  const updateLayout = (key: keyof ThemeLayout, value: string | number) =>
    setTheme(prev => ({ ...prev, layout: { ...prev.layout, [key]: value } }));

  const updateMedia = (key: keyof ThemeMedia, value: boolean | string) =>
    setTheme(prev => ({ ...prev, media: { ...prev.media, [key]: value } }));

  const updateEffects = (key: keyof ThemeEffects, value: boolean | number) =>
    setTheme(prev => ({ ...prev, effects: { ...prev.effects, [key]: value } }));

  const updateBackground = (key: keyof ThemeBackground, value: string | number) =>
    setTheme(prev => ({ ...prev, background: { ...prev.background, [key]: value } }));

  const updateWheel = (key: keyof ThemeWheel, value: string | number | boolean) =>
    setTheme(prev => ({ ...prev, wheel: { ...prev.wheel, [key]: value } }));

  // Only controls relevant to the new skins are exposed. The classic-only tabs
  // (background/layout/media/sounds) stay in code (still referenced by the
  // render switch) but are hidden, so the editor stops showing knobs that do
  // nothing on these themes.
  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'colors', label: 'Colores' },
    { key: 'effects', label: 'Efectos' },
  ];

  const renderColors = () => (
    <div className="editor-section">
      <h3>Paleta de Colores</h3>
      <p className="section-desc">Define los colores del tema — haz clic en un swatch de la preview para saltar a ese color</p>
      <div style={{ display: 'flex', gap: 24, padding: '12px 14px', marginBottom: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8 }}>
        {([['base_hue', 'Matiz principal'], ['base_hue2', 'Matiz secundario']] as const).map(([key, label]) => {
          const val = theme.hw?.[key] ?? (key === 'base_hue' ? 35 : 200);
          return (
            <label key={key} style={{ flex: 1, fontSize: 12 }}>
              <span style={{ display: 'block', marginBottom: 6, opacity: .7 }}>{label}: {Math.round(val)}°</span>
              <input type="range" min={0} max={360} step={1} value={val}
                onChange={(e) => updateHue(key, +e.target.value)}
                style={{ width: '100%', accentColor: `oklch(72% 0.2 ${val})` }} />
            </label>
          );
        })}
      </div>
      <div className="color-grid">
        {Object.entries(theme.colors).map(([key, value]) => {
          const active = focusedColor === key;
          return (
            <div
              key={key}
              ref={(el) => { colorRefs.current[key] = el; }}
              className="color-item"
              style={active ? { outline: `2px solid ${value}`, outlineOffset: 3, boxShadow: `0 0 12px ${value}66` } : undefined}
              onAnimationEnd={() => setFocusedColor(null)}
            >
              <label style={{ color: active ? value : undefined }}>{key.replace(/_/g, ' ')}</label>
              <div className="color-input-row">
                <input type="color" value={value}
                  onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)} />
                <input type="text" value={value} className="color-text-input"
                  onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)} />
              </div>
              <div className="color-preview" style={{ backgroundColor: value }} />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFonts = () => (
    <div className="editor-section">
      <h3>Fuentes</h3>
      <p className="section-desc">Tipografía para los distintos elementos de la UI</p>
      <div className="font-list">
        {(['ui', 'title', 'subtitle', 'mono'] as const).map((key) => (
          <div key={key} className="font-item">
            <label>{key}</label>
            <select value={theme.fonts[key]}
              onChange={(e) => updateFont(key, e.target.value)}>
              {['Arial', 'Impact', 'Consolas', 'Verdana', 'Georgia',
                'Times New Roman', 'Courier New', 'Trebuchet MS', 'Segoe UI'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="font-preview" style={{ fontFamily: theme.fonts[key] }}>Arcade 123</span>
          </div>
        ))}
        <div className="font-item">
          <label>Google Font</label>
          <input type="text" value={theme.fonts.google_font}
            onChange={(e) => updateFont('google_font', e.target.value)}
            placeholder="Press Start 2P, Orbitron, Rajdhani..."
            style={{ flex: 1, padding: '5px 8px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 12 }} />
          {theme.fonts.google_font && (
            <span className="font-preview" style={{ fontFamily: theme.fonts.google_font, fontSize: 11, color: theme.colors.accent }}>
              {theme.fonts.google_font}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderLayout = () => (
    <div className="editor-section">
      <h3>Diseño y Navegación</h3>
      <p className="section-desc">Vista de sistemas y juegos</p>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Vista de Sistemas</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { value: 'carousel', label: 'Carrusel 3D', diagram: '◀ ① ② ③ ▶' },
          { value: 'grid',    label: 'Cuadrícula',  diagram: '▣ ▣\n▣ ▣' },
          { value: 'list',    label: 'Lista',        diagram: '━━━\n━━━\n━━━' },
        ].map(opt => (
          <button key={opt.value} onClick={() => updateLayout('system_view', opt.value)}
            style={{
              flex: '1 1 110px', padding: '10px 8px',
              border: `2px solid ${theme.layout.system_view === opt.value ? theme.colors.primary : '#444'}`,
              borderRadius: 8,
              background: theme.layout.system_view === opt.value ? `${theme.colors.primary}22` : '#1a1a2e',
              color: theme.layout.system_view === opt.value ? theme.colors.primary : '#ccc',
              cursor: 'pointer', textAlign: 'center',
            }}>
            <div style={{ fontSize: 16, marginBottom: 4, whiteSpace: 'pre', lineHeight: 1.3 }}>{opt.diagram}</div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{opt.label}</div>
          </button>
        ))}
      </div>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Vista de Juegos</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { value: 'split',   label: 'Dividida',  diagram: '▌▌▐▐' },
          { value: 'full',    label: 'Completa',  diagram: '▓▓▓▓' },
          { value: 'compact', label: 'Compacta',  diagram: '━━\n━━\n━━' },
        ].map(opt => (
          <button key={opt.value} onClick={() => updateLayout('game_view', opt.value)}
            style={{
              flex: '1 1 110px', padding: '10px 8px',
              border: `2px solid ${theme.layout.game_view === opt.value ? theme.colors.accent : '#444'}`,
              borderRadius: 8,
              background: theme.layout.game_view === opt.value ? `${theme.colors.accent}22` : '#1a1a2e',
              color: theme.layout.game_view === opt.value ? theme.colors.accent : '#ccc',
              cursor: 'pointer', textAlign: 'center',
            }}>
            <div style={{ fontSize: 16, marginBottom: 4, whiteSpace: 'pre', lineHeight: 1.3 }}>{opt.diagram}</div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{opt.label}</div>
          </button>
        ))}
      </div>
      <div className="setting-list">
        <div className="setting-item">
          <label>Estilo del Wheel</label>
          <select value={theme.layout.wheel_style}
            onChange={(e) => updateLayout('wheel_style', e.target.value)}>
            <option value="3d">3D Wheel</option>
            <option value="flat">Plano</option>
            <option value="hidden">Oculto</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Tipo de Transición</label>
          <select value={theme.layout.transition}
            onChange={(e) => updateLayout('transition', e.target.value)}>
            <option value="slide">Deslizar</option>
            <option value="fade">Fundido</option>
            <option value="scale">Escalar</option>
            <option value="flip">Voltear</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Velocidad ({theme.layout.animation_speed}ms)</label>
          <input type="range" min="100" max="1000" step="50"
            value={theme.layout.animation_speed}
            onChange={(e) => updateLayout('animation_speed', Number(e.target.value))} />
        </div>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="editor-section">
      <h3>Imágenes y Multimedia</h3>
      <p className="section-desc">Video, imágenes y artwork</p>
      <div className="setting-list">
        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <label style={{ fontWeight: 600 }}>Imagen de fondo personalizada</label>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input type="text" value={theme.media.background_image}
              onChange={(e) => updateMedia('background_image', e.target.value)}
              placeholder="C:\ruta\fondo.jpg"
              style={{ flex: 1, padding: '5px 8px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 12 }} />
            {theme.media.background_image && (
              <button onClick={() => updateMedia('background_image', '')}
                style={{ padding: '4px 8px', background: '#522', border: '1px solid #f66', borderRadius: 4, color: '#eee', cursor: 'pointer', fontSize: 12 }}>
                Quitar
              </button>
            )}
          </div>
        </div>
        {([
          ['video_enabled', 'Video Preview'],
          ['video_loop', 'Loop de Video'],
          ['marquee_enabled', 'Marquee'],
          ['wheel_enabled', 'Game Wheel'],
          ['box_art_enabled', 'Box Art'],
        ] as [keyof ThemeMedia, string][]).map(([key, label]) => (
          <div key={key} className="setting-item toggle">
            <label>{label}</label>
            <input type="checkbox" checked={theme.media[key] as boolean}
              onChange={(e) => updateMedia(key, e.target.checked)} />
          </div>
        ))}
        <div className="setting-item">
          <label>Snap Type</label>
          <select value={theme.media.snap_type}
            onChange={(e) => updateMedia('snap_type', e.target.value)}>
            <option value="video">Video</option>
            <option value="screenshot">Screenshot</option>
            <option value="title">Title Screen</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSounds = () => (
    <div className="editor-section">
      <h3>Sonidos de la UI</h3>
      <p className="section-desc">Asigna sonidos a acciones del menú</p>
      <div className="setting-list">
        {Object.entries(theme.sounds).map(([key, value]) => (
          <div key={key} className="setting-item">
            <label>{key}</label>
            <input type="text" value={value}
              onChange={(e) => setTheme(prev => ({ ...prev, sounds: { ...prev.sounds, [key]: e.target.value } }))}
              placeholder="sound.wav" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderBackground = () => (
    <div className="editor-section">
      <h3>Fondo</h3>
      <p className="section-desc">Tipo de fondo y efectos de superposición</p>
      <div className="setting-list">
        <div className="setting-item">
          <label>Tipo de Fondo</label>
          <select value={theme.background.type}
            onChange={(e) => updateBackground('type', e.target.value as ThemeBackground['type'])}>
            <option value="color">Color sólido</option>
            <option value="gradient">Gradiente CSS</option>
            <option value="image">Imagen</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Color base</label>
          <div className="color-input-row">
            <input type="color" value={theme.background.color}
              onChange={(e) => updateBackground('color', e.target.value)} />
            <input type="text" value={theme.background.color} className="color-text-input"
              onChange={(e) => updateBackground('color', e.target.value)} />
          </div>
        </div>
        {theme.background.type === 'gradient' && (
          <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <label>Gradiente CSS</label>
            <input type="text" value={theme.background.gradient}
              onChange={(e) => updateBackground('gradient', e.target.value)}
              placeholder="linear-gradient(135deg, #0a0a0a, #1a0a2e)"
              style={{ width: '100%', padding: '5px 8px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 11 }} />
            {theme.background.gradient && (
              <div style={{ width: '100%', height: 32, borderRadius: 4, background: theme.background.gradient, marginTop: 4, border: '1px solid #444' }} />
            )}
          </div>
        )}
        {(theme.background.type === 'image' || theme.background.type === 'video') && (
          <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <label>{theme.background.type === 'image' ? 'Ruta de imagen' : 'Ruta de video'}</label>
            <input type="text"
              value={theme.background.type === 'image' ? theme.background.image : theme.background.video}
              onChange={(e) => updateBackground(theme.background.type === 'image' ? 'image' : 'video', e.target.value)}
              placeholder="assets/background.jpg"
              style={{ width: '100%', padding: '5px 8px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 11 }} />
          </div>
        )}
        <div className="setting-item">
          <label>Opacidad ({Math.round(theme.background.opacity * 100)}%)</label>
          <input type="range" min="0" max="1" step="0.05" value={theme.background.opacity}
            onChange={(e) => updateBackground('opacity', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Desenfoque ({theme.background.blur}px)</label>
          <input type="range" min="0" max="40" step="1" value={theme.background.blur}
            onChange={(e) => updateBackground('blur', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Overlay</label>
          <div className="color-input-row">
            <input type="color" value={theme.background.overlay_color || '#000000'}
              onChange={(e) => updateBackground('overlay_color', e.target.value)} />
            <input type="text" value={theme.background.overlay_color} className="color-text-input"
              onChange={(e) => updateBackground('overlay_color', e.target.value)}
              placeholder="#00000066" />
          </div>
        </div>
      </div>
      <h3 style={{ marginTop: 20 }}>Wheel</h3>
      <div className="setting-list">
        <div className="setting-item">
          <label>Tamaño item ({theme.wheel.item_size}px)</label>
          <input type="range" min="60" max="200" step="5" value={theme.wheel.item_size}
            onChange={(e) => updateWheel('item_size', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Separación ({theme.wheel.item_spacing}px)</label>
          <input type="range" min="0" max="50" step="2" value={theme.wheel.item_spacing}
            onChange={(e) => updateWheel('item_spacing', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Escala seleccionado ({theme.wheel.selected_scale.toFixed(2)}x)</label>
          <input type="range" min="1" max="1.5" step="0.05" value={theme.wheel.selected_scale}
            onChange={(e) => updateWheel('selected_scale', Number(e.target.value))} />
        </div>
        <div className="setting-item toggle">
          <label>Glow en seleccionado</label>
          <input type="checkbox" checked={theme.wheel.glow_selected}
            onChange={(e) => updateWheel('glow_selected', e.target.checked)} />
        </div>
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className="editor-section">
      <h3>Efectos Visuales</h3>
      <p className="section-desc">Post-procesado y filtros visuales</p>
      <div className="setting-list">
        <div className="setting-item toggle">
          <label>Scanlines (efecto CRT)</label>
          <input type="checkbox" checked={theme.effects.scanlines}
            onChange={(e) => updateEffects('scanlines', e.target.checked)} />
        </div>
        <div className="setting-item toggle">
          <label>Sombras</label>
          <input type="checkbox" checked={theme.effects.shadow_enabled}
            onChange={(e) => updateEffects('shadow_enabled', e.target.checked)} />
        </div>
        <div className="setting-item">
          <label>Curvatura CRT ({Math.round(theme.effects.crt_curve * 100)}%)</label>
          <input type="range" min="0" max="1" step="0.05" value={theme.effects.crt_curve}
            onChange={(e) => updateEffects('crt_curve', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Glow ({Math.round(theme.effects.glow_intensity * 100)}%)</label>
          <input type="range" min="0" max="1" step="0.05" value={theme.effects.glow_intensity}
            onChange={(e) => updateEffects('glow_intensity', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Viñeta ({Math.round(theme.effects.vignette * 100)}%)</label>
          <input type="range" min="0" max="1" step="0.05" value={theme.effects.vignette}
            onChange={(e) => updateEffects('vignette', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Ruido de película ({Math.round(theme.effects.noise * 100)}%)</label>
          <input type="range" min="0" max="0.2" step="0.01" value={theme.effects.noise}
            onChange={(e) => updateEffects('noise', Number(e.target.value))} />
        </div>
        <div className="setting-item">
          <label>Blur no-seleccionado ({theme.effects.blur_unselected}px)</label>
          <input type="range" min="0" max="8" step="1" value={theme.effects.blur_unselected}
            onChange={(e) => updateEffects('blur_unselected', Number(e.target.value))} />
        </div>
      </div>
    </div>
  );

  const renderCompose = () => {
    const c = compose ?? DEFAULT_COMPOSE;
    const opts = THEME_REGISTRY.filter(t => t.status === 'available');
    const zones: { key: keyof ComposeMap; label: string }[] = [
      { key: 'home', label: 'Inicio / Menú' },
      { key: 'systems', label: 'Sistemas' },
      { key: 'games', label: 'Juegos' },
    ];
    const nameOf = (skin: SkinId) => opts.find(o => o.skin === skin)?.name ?? skin;
    const accentOf = (skin: SkinId) => opts.find(o => o.skin === skin)?.accent ?? '#888';
    const assign = (zone: keyof ComposeMap, skin: SkinId) => setCompose({ ...c, [zone]: skin });

    return (
      <div className="editor-section">
        <h3>Componer tema · arrastra y suelta</h3>
        <p className="section-desc">Arrastra un tema a cada pantalla (o haz clic para asignarlo a todas). El preview "Tema" muestra la mezcla en vivo; al guardar se crea un tema <b>composed</b>.</p>

        {/* Palette of draggable theme tiles */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {opts.map(o => (
            <div key={o.id} draggable
              onDragStart={e => { e.dataTransfer.setData('text/skin', o.skin); e.dataTransfer.effectAllowed = 'copy'; }}
              onClick={() => setCompose({ home: o.skin, systems: o.skin, games: o.skin })}
              title={`Arrastra "${o.name}" a una pantalla, o clic para usarlo en todas`}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'grab', userSelect: 'none',
                border: `2px solid ${o.accent}`, background: `${o.accent}18`, color: o.accent,
                fontWeight: 600, fontSize: 12,
              }}>
              ⠿ {o.name}
            </div>
          ))}
        </div>

        {/* Drop zones, one per screen */}
        <div style={{ display: 'flex', gap: 10 }}>
          {zones.map(z => {
            const cur = c[z.key];
            return (
              <div key={z.key}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={e => {
                  e.preventDefault();
                  const s = e.dataTransfer.getData('text/skin') as SkinId;
                  if (s) assign(z.key, s);
                }}
                style={{
                  flex: 1, minHeight: 96, borderRadius: 10, padding: 10, textAlign: 'center',
                  border: `2px dashed ${accentOf(cur)}`, background: `${accentOf(cur)}11`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <div style={{ fontSize: 10, opacity: .6, textTransform: 'uppercase', letterSpacing: 1.5 }}>{z.label}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: accentOf(cur) }}>{nameOf(cur)}</div>
                <div style={{ fontSize: 9, opacity: .45 }}>suelta un tema aquí</div>
              </div>
            );
          })}
        </div>

        {compose && (
          <button onClick={() => setCompose(null)}
            style={{ marginTop: 14, padding: '6px 12px', background: '#333', border: '1px solid #555', borderRadius: 6, color: '#ccc', cursor: 'pointer', fontSize: 12 }}>
            Quitar composición (usar un solo skin)
          </button>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'compose': return renderCompose();
      case 'colors': return renderColors();
      case 'fonts': return renderFonts();
      case 'background': return renderBackground();
      case 'layout': return renderLayout();
      case 'media': return renderMedia();
      case 'sounds': return renderSounds();
      case 'effects': return renderEffects();
      default: return null;
    }
  };

  const glow = (color: string, intensity = theme.effects.glow_intensity) =>
    intensity > 0 ? `0 0 ${Math.round(intensity * 24)}px ${color}` : 'none';

  const prevSys = WHEEL_SYSTEMS[previewSystem];

  // Real-skin preview: which skin to render + the canonical --theme-* vars to scope.
  const previewSkin: SkinId = (theme.skin && theme.skin !== 'classic'
    ? theme.skin
    : (storeTheme?.skin && storeTheme.skin !== 'classic' ? storeTheme.skin : 'hyperrush')) as SkinId;
  const previewVars: React.CSSProperties = {
    ['--theme-accent' as string]: theme.colors.accent,
    ['--theme-accent-hot' as string]: theme.colors.highlight || theme.colors.accent,
    ['--theme-text' as string]: theme.colors.text,
    ['--theme-bone' as string]: theme.colors.text,
    ['--theme-bg' as string]: theme.colors.background,
    ['--theme-deep' as string]: theme.colors.background,
    ['--theme-surface' as string]: theme.colors.surface,
    ['--theme-border' as string]: theme.colors.border,
    ['--theme-h' as string]: String(theme.hw?.base_hue ?? 35),
    ['--theme-h2' as string]: String(theme.hw?.base_hue2 ?? 200),
  } as React.CSSProperties;

  return (
    <div className="theme-editor">
      {/* Header */}
      <div className="editor-header" style={{ flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Editor de Temas</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-save" onClick={saveTheme} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar y Aplicar'}
            </button>
            <button className="btn-export" onClick={exportTheme}>Exportar</button>
          </div>
        </div>
        <div className="editor-actions" style={{ flexWrap: 'wrap', gap: 4 }}>
          {/* Template creation */}
          <div style={{ position: 'relative' }}>
            <button className="btn-secondary" onClick={() => { setShowTemplateInput(!showTemplateInput); setShowImportInput(false); }}
              title="Crear nuevo tema desde plantilla">
              Nueva plantilla ▾
            </button>
            {showTemplateInput && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#1a1a2e', border: '1px solid #444', borderRadius: 6, padding: 10, width: 220, marginTop: 4 }}>
                <p style={{ color: '#aaa', fontSize: 11, margin: '0 0 6px' }}>Nombre del nuevo tema:</p>
                <input type="text" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
                  placeholder="mi-tema-custom" autoFocus
                  style={{ width: '100%', padding: '5px 8px', background: '#0d0d1a', border: '1px solid #555', borderRadius: 4, color: '#eee', fontSize: 12, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={handleCreateTemplate}
                    style={{ flex: 1, padding: '5px 0', background: '#7c3aed', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11 }}>
                    Crear
                  </button>
                  <button onClick={() => setShowTemplateInput(false)}
                    style={{ padding: '5px 10px', background: '#333', border: 'none', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 11 }}>
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* My themes dropdown */}
          {themeList.filter(t => t.is_custom).length > 0 && (
            <select onChange={(e) => { if (e.target.value) handleLoadCustomTheme(e.target.value); e.target.value = ''; }}
              defaultValue="" title="Cargar uno de mis temas personalizados"
              style={{ fontSize: 12, padding: '4px 8px', background: '#1a1a2e', border: '1px solid #7c3aed', borderRadius: 4, color: '#eee', cursor: 'pointer' }}>
              <option value="" disabled>Mis Temas ▾</option>
              {themeList.filter(t => t.is_custom).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Bundled themes dropdown */}
          <select onChange={(e) => { if (e.target.value) { loadThemeById(e.target.value); setCurrentThemeIsCustom(false); } e.target.value = ''; }}
            defaultValue="" title="Cargar tema incluido como base">
            <option value="" disabled>Temas incluidos ▾</option>
            {themeList.filter(t => !t.is_custom).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Import folder */}
          <div style={{ position: 'relative' }}>
            <button className="btn-secondary" onClick={() => { setShowImportInput(!showImportInput); setShowTemplateInput(false); }}
              title="Importar tema desde carpeta externa">
              Importar carpeta
            </button>
            {showImportInput && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#1a1a2e', border: '1px solid #444', borderRadius: 6, padding: 10, width: 280, marginTop: 4 }}>
                <p style={{ color: '#aaa', fontSize: 11, margin: '0 0 6px' }}>Ruta de la carpeta del tema:</p>
                <input type="text" value={importPath} onChange={(e) => setImportPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleImportFolder()}
                  placeholder="C:\Mis Temas\mi-tema" autoFocus
                  style={{ width: '100%', padding: '5px 8px', background: '#0d0d1a', border: '1px solid #555', borderRadius: 4, color: '#eee', fontSize: 11, boxSizing: 'border-box' }} />
                <p style={{ color: '#666', fontSize: 10, margin: '4px 0 6px' }}>La carpeta debe contener theme.json</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleImportFolder}
                    style={{ flex: 1, padding: '5px 0', background: '#0d5c2e', border: '1px solid #0f0', borderRadius: 4, color: '#0f0', cursor: 'pointer', fontSize: 11 }}>
                    Importar
                  </button>
                  <button onClick={() => setShowImportInput(false)}
                    style={{ padding: '5px 10px', background: '#333', border: 'none', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 11 }}>
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Open folder — only for custom themes */}
          {currentThemeIsCustom && (
            <button className="btn-secondary" onClick={handleOpenFolder} title="Abrir carpeta del tema en el explorador">
              Abrir carpeta
            </button>
          )}

          {/* Layout editor */}
          <button className="btn-secondary" onClick={() => setShowLayoutEditor(true)} title="Editor visual de layout drag-and-drop"
            style={{ borderColor: '#7c3aed', color: '#c084fc' }}>
            Editor Visual ✦
          </button>

          {/* SDK Manual */}
          <button className="btn-secondary" onClick={() => setShowSDKManual(true)} title="Manual del SDK de temas">
            Manual SDK
          </button>

          {/* AI Assistant */}
          <button className="btn-ai" onClick={() => setShowAIHelper(true)}>Asistente</button>
        </div>
      </div>

      {message && (
        <div className="editor-message" style={{ background: message.ok ? '#1a3a1a' : '#3a1a1a', color: message.ok ? '#00ff00' : '#ff6666' }}>
          {message.text}
        </div>
      )}

      {/* Body */}
      <div className="editor-body" style={{ display: 'flex', gap: 0, alignItems: 'flex-start', flex: 1, overflow: 'hidden' }}>

        {/* Left: tabs + content */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="editor-tabs" style={{ flexDirection: 'row', width: '100%', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button key={tab.key}
                className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{ borderLeft: 'none', borderBottom: `3px solid ${activeTab === tab.key ? theme.colors.primary : 'transparent'}` }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="editor-content" style={{ flex: 1, overflowY: 'auto' }}>
            {renderTabContent()}
          </div>
        </div>

        {/* Right: live preview */}
        <div style={{ width: 320, flexShrink: 0, borderLeft: `2px solid ${theme.colors.border}`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', background: '#0d0d0d', borderBottom: `1px solid ${theme.colors.border}`, fontSize: 10, color: theme.colors.accent, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Vista Previa</span>
            <div style={{ display: 'flex', gap: 0, border: `1px solid ${theme.colors.border}`, borderRadius: 4, overflow: 'hidden' }}>
              {(['real', 'sistema', 'menu'] as const).map(mode => (
                <button key={mode} onClick={() => setPreviewMode(mode)}
                  style={{
                    padding: '2px 8px', fontSize: 9, border: 'none', cursor: 'pointer',
                    background: previewMode === mode ? theme.colors.primary : 'transparent',
                    color: previewMode === mode ? theme.colors.background : theme.colors.text,
                    textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600,
                  }}>
                  {mode === 'real' ? 'Tema' : mode === 'sistema' ? 'Sistema' : 'Menú'}
                </button>
              ))}
            </div>
          </div>

          {/* Real skin preview — renders the actual active skin live */}
          {previewMode === 'real' && (
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 10, background: '#0a0a0a' }}>
              <SkinPreview skin={previewSkin} vars={previewVars} width={300} compose={compose ?? undefined} />
            </div>
          )}

          {/* Menu preview */}
          {previewMode === 'menu' && (
            <div style={{ flex: 1, overflow: 'hidden', background: theme.background.color || theme.colors.background, fontFamily: theme.fonts.ui, display: 'flex', flexDirection: 'column' }}>
              {/* Logo */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 16px 8px', gap: 6 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontFamily: theme.fonts.title, fontSize: 42, fontWeight: 900, letterSpacing: 6, lineHeight: 1 }}>
                    <span style={{ color: theme.colors.primary, textShadow: `0 0 20px ${theme.colors.primary}` }}>Neo</span>
                    <span style={{ color: theme.colors.text, textShadow: `0 0 12px ${theme.colors.text}66` }}>Cab</span>
                  </div>
                  <div style={{ position: 'absolute', inset: -10, background: `radial-gradient(ellipse, ${theme.colors.primary}22 0%, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />
                </div>
                <div style={{ color: theme.colors.text, opacity: 0.5, fontSize: 9, letterSpacing: 4, textTransform: 'uppercase' }}>Arcade OS</div>
              </div>
              {/* Buttons */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', gap: 8 }}>
                {[
                  { icon: '▶', label: 'Jugar', primary: true },
                  { icon: '◎', label: 'Explorar' },
                  { icon: '⚙', label: 'Configuración' },
                  { icon: '🔑', label: 'Operador' },
                ].map(btn => (
                  <div key={btn.label} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: btn.primary ? '10px 14px' : '7px 14px',
                    border: `${btn.primary ? 2 : 1}px solid ${btn.primary ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: 8,
                    background: btn.primary
                      ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.highlight || theme.colors.primary})`
                      : theme.colors.surface,
                    color: btn.primary ? theme.colors.background : theme.colors.text,
                    fontSize: btn.primary ? 13 : 11,
                    fontWeight: 600,
                    boxShadow: btn.primary ? `0 4px 16px ${theme.colors.primary}44` : 'none',
                  }}>
                    <span style={{ fontSize: btn.primary ? 16 : 13 }}>{btn.icon}</span>
                    <span>{btn.label}</span>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div style={{ padding: '8px 16px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.colors.text, opacity: 0.6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.success, display: 'inline-block' }} />
                  Conectado
                </span>
                <span style={{ color: theme.colors.accent }}>NeoCab v1.3</span>
              </div>
            </div>
          )}

          {/* System preview area */}
          {previewMode === 'sistema' && <div style={{
            flex: 1,
            background: theme.background.type === 'gradient' && theme.background.gradient
              ? theme.background.gradient
              : theme.background.type === 'image' && theme.background.image
              ? `url(${theme.background.image}) center/cover`
              : theme.background.color || theme.colors.background,
            filter: theme.background.blur > 0 ? `blur(${theme.background.blur * 0.3}px)` : undefined,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: theme.fonts.ui,
          }}>
            {/* Scanlines overlay */}
            {theme.effects.scanlines && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.2) 2px,rgba(0,0,0,0.2) 4px)',
              }} />
            )}

            {/* Overlay color (background.overlay_color) */}
            {theme.background.overlay_color && (
              <div style={{ position: 'absolute', inset: 0, background: theme.background.overlay_color, pointerEvents: 'none', zIndex: 1 }} />
            )}

            {/* Vignette */}
            {theme.effects.vignette > 0 && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                background: `radial-gradient(ellipse at 50% 50%, transparent ${Math.round((1 - theme.effects.vignette) * 100)}%, rgba(0,0,0,${theme.effects.vignette}) 100%)`,
              }} />
            )}

            {/* Ambient glow */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse at 50% 40%, ${theme.colors.primary}30 0%, transparent 65%)`,
            }} />

            {/* Top bar */}
            <div style={{
              position: 'relative', zIndex: 2,
              padding: '8px 12px',
              borderBottom: `2px solid ${theme.colors.border}`,
              background: `${theme.colors.surface}cc`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{
                fontFamily: theme.fonts.title, fontSize: 18, fontWeight: 900, letterSpacing: 3,
                color: theme.colors.primary,
                textShadow: glow(theme.colors.primary),
              }}>
                NEOCAB
              </span>
              <span style={{ color: theme.colors.accent, fontSize: 9, letterSpacing: 2 }}>
                {prevSys}
              </span>
            </div>

            {/* ── System view (dinámico según layout) ── */}
            {theme.layout.system_view === 'carousel' && (
              <div style={{ position: 'relative', zIndex: 2, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {WHEEL_SYSTEMS.map((sys, i) => {
                  const dist = i - previewSystem;
                  const scale = Math.max(0.3, 1 - Math.abs(dist) * 0.2);
                  const opacity = Math.max(0.1, 1 - Math.abs(dist) * 0.35);
                  const tx = dist * 56;
                  const focused = dist === 0;
                  return (
                    <button key={sys} onClick={() => setPreviewSystem(i)}
                      style={{
                        position: 'absolute',
                        transform: `translateX(${tx}px) scale(${scale})`,
                        opacity, zIndex: focused ? 5 : 3 - Math.abs(dist),
                        transition: 'all 0.3s',
                        background: focused ? `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.secondary})` : theme.colors.surface,
                        border: `2px solid ${focused ? theme.colors.primary : theme.colors.border}`,
                        borderRadius: 8, width: 60, height: 76,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                        cursor: 'pointer',
                        boxShadow: focused ? glow(theme.colors.primary) : 'none',
                      }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: focused ? theme.colors.primary : theme.colors.surface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900,
                        color: focused ? theme.colors.background : theme.colors.text,
                      }}>
                        {sys.charAt(0)}
                      </div>
                      <span style={{ fontSize: 8, color: focused ? theme.colors.primary : theme.colors.text, fontWeight: focused ? 700 : 400 }}>
                        {sys}
                      </span>
                      {focused && <div style={{ position: 'absolute', inset: -4, border: `2px solid ${theme.colors.primary}`, borderRadius: 10, opacity: 0.5 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {theme.layout.system_view === 'grid' && (
              <div style={{ position: 'relative', zIndex: 2, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {WHEEL_SYSTEMS.map((sys, i) => {
                  const focused = i === previewSystem;
                  return (
                    <button key={sys} onClick={() => setPreviewSystem(i)}
                      style={{
                        padding: '8px 4px', borderRadius: 6, cursor: 'pointer',
                        border: `2px solid ${focused ? theme.colors.primary : theme.colors.border}`,
                        background: focused ? `${theme.colors.primary}22` : theme.colors.surface,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        boxShadow: focused ? glow(theme.colors.primary) : 'none',
                        transition: 'all 0.2s',
                      }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: focused ? theme.colors.primary : theme.colors.secondary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900, color: focused ? theme.colors.background : theme.colors.text,
                      }}>{sys.charAt(0)}</div>
                      <span style={{ fontSize: 7, color: focused ? theme.colors.primary : theme.colors.text, fontWeight: 600 }}>{sys}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {theme.layout.system_view === 'list' && (
              <div style={{ position: 'relative', zIndex: 2, padding: '4px 0' }}>
                {WHEEL_SYSTEMS.map((sys, i) => {
                  const focused = i === previewSystem;
                  return (
                    <button key={sys} onClick={() => setPreviewSystem(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '5px 10px',
                        background: focused ? `${theme.colors.primary}22` : 'transparent',
                        borderLeft: `3px solid ${focused ? theme.colors.primary : 'transparent'}`,
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        color: focused ? theme.colors.primary : theme.colors.text,
                        textShadow: focused ? glow(theme.colors.primary, 0.5) : 'none',
                        transition: 'all 0.2s',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: focused ? theme.colors.primary : theme.colors.surface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 900,
                        color: focused ? theme.colors.background : theme.colors.text,
                      }}>{sys.charAt(0)}</div>
                      <span style={{ fontSize: 10, fontWeight: focused ? 700 : 400 }}>{sys}</span>
                      {focused && <span style={{ marginLeft: 'auto', fontSize: 9, color: theme.colors.accent }}>▶</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.colors.border}, transparent)`, zIndex: 2, position: 'relative' }} />

            {/* ── Game view (dinámico) ── */}
            {theme.layout.game_view === 'split' && (
              <div style={{ display: 'flex', position: 'relative', zIndex: 2, flex: 1, overflow: 'hidden' }}>
                <div style={{ width: 90, background: `${theme.colors.surface}dd`, borderRight: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
                  {WHEEL_GAMES.map((game, i) => (
                    <div key={game} style={{
                      padding: '4px 6px', fontSize: 9,
                      background: i === 0 ? `${theme.colors.primary}22` : 'transparent',
                      color: i === 0 ? theme.colors.primary : theme.colors.text,
                      borderLeft: `2px solid ${i === 0 ? theme.colors.primary : 'transparent'}`,
                    }}>{game}</div>
                  ))}
                </div>
                <div style={{ flex: 1, background: `${theme.colors.secondary}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                  <div style={{ width: 50, height: 40, background: `${theme.colors.surface}cc`, border: `1px solid ${theme.colors.border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: theme.colors.text, opacity: 0.6 }}>VIDEO</div>
                  <span style={{ fontSize: 8, color: theme.colors.accent }}>{WHEEL_GAMES[0]}</span>
                </div>
              </div>
            )}

            {theme.layout.game_view === 'full' && (
              <div style={{ position: 'relative', zIndex: 2, flex: 1, background: `${theme.colors.secondary}cc`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 8, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${theme.colors.background}dd)` }} />
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: theme.fonts.title, fontWeight: 900, color: theme.colors.primary, textShadow: glow(theme.colors.primary), letterSpacing: 1 }}>
                    {WHEEL_GAMES[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 8, color: theme.colors.accent, marginTop: 2 }}>{WHEEL_SYSTEMS[previewSystem]}</div>
                </div>
              </div>
            )}

            {theme.layout.game_view === 'compact' && (
              <div style={{ position: 'relative', zIndex: 2, background: `${theme.colors.surface}cc`, flex: 1, overflow: 'hidden' }}>
                {WHEEL_GAMES.concat(['Galaga', 'Contra', '1942']).map((game, i) => (
                  <div key={game} style={{
                    padding: '3px 10px', fontSize: 9,
                    background: i === 0 ? `${theme.colors.primary}22` : i % 2 === 0 ? `${theme.colors.surface}44` : 'transparent',
                    color: i === 0 ? theme.colors.primary : theme.colors.text,
                    borderLeft: `2px solid ${i === 0 ? theme.colors.primary : 'transparent'}`,
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{game}</span>
                    {i === 0 && <span style={{ fontSize: 8, color: theme.colors.accent }}>► JUGAR</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '4px 12px', borderTop: `1px solid ${theme.colors.border}`,
              background: `${theme.colors.surface}cc`,
              display: 'flex', justifyContent: 'space-between', fontSize: 9,
              color: theme.colors.text, opacity: 0.8,
            }}>
              <span>Créditos: 5</span>
              <span style={{ color: theme.colors.accent }}>3:00</span>
              <span style={{ color: theme.colors.success }}>●</span>
            </div>
          </div>}

          {/* Color swatches + apply section */}
          <div style={{ padding: 8, background: '#0d0d0d', borderTop: `1px solid ${theme.colors.border}` }}>
            <p style={{ fontSize: 9, color: '#888', margin: '0 0 4px', textAlign: 'center' }}>
              Clic en un color para editarlo
            </p>
            <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
              {Object.entries(theme.colors).map(([key, val]) => (
                <button
                  key={key}
                  title={key}
                  onClick={() => jumpToColor(key)}
                  style={{
                    width: 20, height: 20, borderRadius: 4, background: val,
                    border: `2px solid ${focusedColor === key ? '#fff' : '#333'}`,
                    cursor: 'pointer', padding: 0,
                    boxShadow: focusedColor === key ? `0 0 8px ${val}` : 'none',
                    transform: focusedColor === key ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <input type="text" value={theme.name}
              onChange={(e) => setTheme(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del tema"
              style={{ width: '100%', padding: '4px 6px', background: '#1a1a2e', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 11, marginBottom: 6, boxSizing: 'border-box' }} />
            {themeList.length > 0 && (
              <select onChange={(e) => e.target.value && applyThemeById(e.target.value)}
                defaultValue=""
                style={{ width: '100%', padding: '4px 6px', background: '#1a1a2e', border: `1px solid ${theme.colors.primary}`, borderRadius: 4, color: '#eee', fontSize: 11 }}>
                <option value="" disabled>Aplicar tema guardado al menú...</option>
                {themeList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {showAIHelper && (
        <ThemeAIHelper
          currentTheme={theme as unknown as Theme}
          onLoad={(t) => loadThemeFromAI(t as unknown as ThemeData)}
          onClose={() => setShowAIHelper(false)}
        />
      )}

      {showSDKManual && (
        <ThemeSDKManual onClose={() => setShowSDKManual(false)} />
      )}

      {showLayoutEditor && (
        <LayoutEditor
          compose={compose ?? DEFAULT_COMPOSE}
          widgets={widgetLayout ?? undefined}
          vars={previewVars}
          onSave={(c, w) => {
            setCompose(c);
            setWidgetLayout(w);
            setShowLayoutEditor(false);
            showMsg('Composición aplicada — pulsa "Guardar y Aplicar" para crear el tema');
          }}
          onClose={() => setShowLayoutEditor(false)}
        />
      )}
    </div>
  );
};
