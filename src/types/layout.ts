export type WidgetType =
  | 'background'
  | 'system-wheel'
  | 'system-logo'
  | 'game-list'
  | 'game-preview'
  | 'game-info'
  | 'clock'
  | 'credits'
  | 'session-timer'
  | 'text-label'
  | 'image';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface ScreenLayout {
  widgets: Widget[];
}

export interface ThemeScreens {
  systems?: ScreenLayout;
  games?: ScreenLayout;
  menu?: ScreenLayout;
}

export const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number; config: Record<string, unknown> }> = {
  'background':    { w: 100, h: 100, config: {} },
  'system-wheel':  { w: 80,  h: 60,  config: { style: 'carousel' } },
  'system-logo':   { w: 30,  h: 20,  config: { use_png: false, fallback: 'initial' } },
  'game-list':     { w: 40,  h: 70,  config: {} },
  'game-preview':  { w: 40,  h: 50,  config: {} },
  'game-info':     { w: 40,  h: 30,  config: {} },
  'clock':         { w: 16,  h: 8,   config: {} },
  'credits':       { w: 16,  h: 8,   config: {} },
  'session-timer': { w: 16,  h: 8,   config: {} },
  'text-label':    { w: 30,  h: 10,  config: { text: 'Texto', font: 'ui', size: 16, color: '#ffffff' } },
  'image':         { w: 25,  h: 25,  config: { src: '', fit: 'contain' } },
};

export const WIDGET_LABELS: Record<WidgetType, string> = {
  'background':    'Fondo',
  'system-wheel':  'Rueda de Sistemas',
  'system-logo':   'Logo de Sistema',
  'game-list':     'Lista de Juegos',
  'game-preview':  'Preview de Juego',
  'game-info':     'Info de Juego',
  'clock':         'Reloj',
  'credits':       'Créditos',
  'session-timer': 'Temporizador',
  'text-label':    'Texto Libre',
  'image':         'Imagen',
};

export const WIDGET_ICONS: Record<WidgetType, string> = {
  'background':    '☰',
  'system-wheel':  '⊞',
  'system-logo':   '⊛',
  'game-list':     '≡',
  'game-preview':  '▶',
  'game-info':     'ℹ',
  'clock':         '⊙',
  'credits':       '♦',
  'session-timer': '⏱',
  'text-label':    'T',
  'image':         '🖼',
};
