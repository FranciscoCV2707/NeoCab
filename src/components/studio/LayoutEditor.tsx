import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Widget, WidgetType, ThemeScreens, ScreenLayout } from '../../types/layout';
import { WIDGET_DEFAULTS, WIDGET_LABELS, WIDGET_ICONS } from '../../types/layout';

interface Props {
  screens: ThemeScreens | undefined;
  themeColors: Record<string, string>;
  themeFonts: Record<string, string>;
  onSave: (screens: ThemeScreens) => void;
  onClose: () => void;
}

type ScreenKey = 'systems' | 'games' | 'menu';

const RESOLUTIONS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1280×720',  w: 1280, h: 720 },
  { label: '2560×1440', w: 2560, h: 1440 },
  { label: '1080×1920 (vertical)', w: 1080, h: 1920 },
];

const PALETTE_TYPES: WidgetType[] = [
  'background', 'system-wheel', 'system-logo',
  'game-list', 'game-preview', 'game-info',
  'clock', 'credits', 'session-timer',
  'text-label', 'image',
];

const WIDGET_COLORS: Record<WidgetType, string> = {
  'background':    'rgba(30,30,80,0.7)',
  'system-wheel':  'rgba(255,107,0,0.35)',
  'system-logo':   'rgba(0,255,200,0.25)',
  'game-list':     'rgba(100,100,255,0.3)',
  'game-preview':  'rgba(200,50,200,0.3)',
  'game-info':     'rgba(50,200,100,0.3)',
  'clock':         'rgba(255,200,0,0.3)',
  'credits':       'rgba(0,200,255,0.3)',
  'session-timer': 'rgba(255,100,0,0.3)',
  'text-label':    'rgba(200,200,200,0.25)',
  'image':         'rgba(150,100,50,0.3)',
};

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

function makeDefaultLayout(): ScreenLayout {
  return {
    widgets: [
      { id: makeId(), type: 'background',   x: 0,  y: 0,  w: 100, h: 100, z: 0, visible: true, config: {} },
      { id: makeId(), type: 'system-wheel', x: 10, y: 5,  w: 80,  h: 60,  z: 1, visible: true, config: { style: 'carousel' } },
      { id: makeId(), type: 'system-logo',  x: 35, y: 70, w: 30,  h: 20,  z: 2, visible: true, config: { use_png: false, fallback: 'initial' } },
      { id: makeId(), type: 'clock',        x: 82, y: 2,  w: 16,  h: 7,   z: 3, visible: true, config: {} },
      { id: makeId(), type: 'credits',      x: 2,  y: 2,  w: 16,  h: 7,   z: 3, visible: true, config: {} },
    ],
  };
}

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

export const LayoutEditor: React.FC<Props> = ({ screens, themeColors, themeFonts, onSave, onClose }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('systems');
  const [resIdx, setResIdx] = useState(0);
  const resolution = RESOLUTIONS[resIdx];

  const [layouts, setLayouts] = useState<Record<ScreenKey, ScreenLayout>>(() => ({
    systems: screens?.systems ?? makeDefaultLayout(),
    games:   screens?.games   ?? { widgets: [] },
    menu:    screens?.menu    ?? { widgets: [] },
  }));

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ widgetId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeState = useRef<{ widgetId: string; startX: number; startY: number; origW: number; origH: number } | null>(null);

  const currentLayout = layouts[activeScreen];
  const setCurrentLayout = useCallback((fn: (prev: ScreenLayout) => ScreenLayout) => {
    setLayouts(prev => ({ ...prev, [activeScreen]: fn(prev[activeScreen]) }));
  }, [activeScreen]);

  const selectedWidget = currentLayout.widgets.find(w => w.id === selectedId) ?? null;

  // --- Add widget from palette ---
  const addWidget = (type: WidgetType) => {
    const def = WIDGET_DEFAULTS[type];
    const newWidget: Widget = {
      id: makeId(),
      type,
      x: clamp(50 - def.w / 2, 0, 100 - def.w),
      y: clamp(50 - def.h / 2, 0, 100 - def.h),
      w: def.w,
      h: def.h,
      z: currentLayout.widgets.length + 1,
      visible: true,
      config: { ...def.config },
    };
    setCurrentLayout(prev => ({ widgets: [...prev.widgets, newWidget] }));
    setSelectedId(newWidget.id);
  };

  // --- Delete selected widget ---
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setCurrentLayout(prev => ({ widgets: prev.widgets.filter(w => w.id !== selectedId) }));
    setSelectedId(null);
  }, [selectedId, setCurrentLayout]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  // --- Drag to move ---
  const onWidgetMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if ((e.target as HTMLElement).dataset.resize) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(widgetId);
    const widget = currentLayout.widgets.find(w => w.id === widgetId)!;
    dragState.current = { widgetId, startX: e.clientX, startY: e.clientY, origX: widget.x, origY: widget.y };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (dragState.current) {
      const { widgetId, startX, startY, origX, origY } = dragState.current;
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const widget = layouts[activeScreen].widgets.find(w => w.id === widgetId);
      if (!widget) return;
      const newX = clamp(origX + dx, 0, 100 - widget.w);
      const newY = clamp(origY + dy, 0, 100 - widget.h);
      setCurrentLayout(prev => ({
        widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, x: newX, y: newY } : w),
      }));
    }

    if (resizeState.current) {
      const { widgetId, startX, startY, origW, origH } = resizeState.current;
      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const widget = layouts[activeScreen].widgets.find(w => w.id === widgetId);
      if (!widget) return;
      const newW = clamp(origW + dx, 5, 100 - widget.x);
      const newH = clamp(origH + dy, 4, 100 - widget.y);
      setCurrentLayout(prev => ({
        widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, w: newW, h: newH } : w),
      }));
    }
  }, [activeScreen, layouts, setCurrentLayout]);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
    resizeState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // --- Resize handle ---
  const onResizeMouseDown = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const widget = currentLayout.widgets.find(w => w.id === widgetId)!;
    resizeState.current = { widgetId, startX: e.clientX, startY: e.clientY, origW: widget.w, origH: widget.h };
  };

  // --- Update widget property ---
  const updateWidget = (id: string, patch: Partial<Widget>) => {
    setCurrentLayout(prev => ({
      widgets: prev.widgets.map(w => w.id === id ? { ...w, ...patch } : w),
    }));
  };

  const updateConfig = (id: string, key: string, value: unknown) => {
    setCurrentLayout(prev => ({
      widgets: prev.widgets.map(w => w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w),
    }));
  };

  // --- Save ---
  const handleSave = () => {
    onSave({ systems: layouts.systems, games: layouts.games, menu: layouts.menu });
  };

  // --- Reset current screen ---
  const handleReset = () => {
    setCurrentLayout(() => activeScreen === 'systems' ? makeDefaultLayout() : { widgets: [] });
    setSelectedId(null);
  };

  // Canvas aspect ratio
  const aspectRatio = resolution.w / resolution.h;

  const numInput = (label: string, val: number, onChange: (v: number) => void, min = 0, max = 100, step = 0.5) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
      <label style={{ fontSize:11, color:'#aaa' }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        <button onClick={() => onChange(clamp(+(val - step).toFixed(1), min, max))} style={{ width:18, height:18, background:'#333', border:'none', color:'#aaa', cursor:'pointer', borderRadius:2, fontSize:10 }}>-</button>
        <input type="number" value={Math.round(val * 10) / 10} min={min} max={max} step={step}
          onChange={e => onChange(clamp(+e.target.value, min, max))}
          style={{ width:48, padding:'1px 4px', background:'#0d0d1a', border:'1px solid #444', borderRadius:3, color:'#eee', fontSize:11, textAlign:'center' }} />
        <button onClick={() => onChange(clamp(+(val + step).toFixed(1), min, max))} style={{ width:18, height:18, background:'#333', border:'none', color:'#aaa', cursor:'pointer', borderRadius:2, fontSize:10 }}>+</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,0.95)', display:'flex', flexDirection:'column', fontFamily:'Arial,sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ padding:'8px 16px', background:'#0d0d1a', borderBottom:'1px solid #333', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontWeight:700, fontSize:14, color:'#c084fc', marginRight:8 }}>Editor Visual de Layout</span>

        {/* Screen tabs */}
        <div style={{ display:'flex', gap:2, border:'1px solid #333', borderRadius:4, overflow:'hidden' }}>
          {(['systems','games','menu'] as ScreenKey[]).map(key => (
            <button key={key} onClick={() => { setActiveScreen(key); setSelectedId(null); }}
              style={{ padding:'5px 12px', fontSize:11, border:'none', cursor:'pointer', fontWeight:600,
                background: activeScreen === key ? themeColors.primary ?? '#ff6b00' : 'transparent',
                color: activeScreen === key ? (themeColors.background ?? '#000') : '#aaa',
                textTransform:'capitalize' }}>
              {key === 'systems' ? 'Sistemas' : key === 'games' ? 'Juegos' : 'Menú'}
            </button>
          ))}
        </div>

        {/* Resolution */}
        <select value={resIdx} onChange={e => setResIdx(+e.target.value)}
          style={{ padding:'4px 8px', background:'#1a1a2e', border:'1px solid #444', borderRadius:4, color:'#eee', fontSize:11 }}>
          {RESOLUTIONS.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
        </select>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={handleReset}
            style={{ padding:'5px 12px', background:'#2a1a1a', border:'1px solid #f66', borderRadius:4, color:'#f88', cursor:'pointer', fontSize:11 }}>
            Restablecer
          </button>
          <button onClick={handleSave}
            style={{ padding:'5px 14px', background:'#7c3aed', border:'none', borderRadius:4, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>
            Aplicar al tema ✓
          </button>
          <button onClick={onClose}
            style={{ padding:'5px 12px', background:'#222', border:'1px solid #444', borderRadius:4, color:'#aaa', cursor:'pointer', fontSize:11 }}>
            Cerrar
          </button>
        </div>
      </div>

      {/* ── Body: Palette | Canvas | Properties ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Palette */}
        <div style={{ width:160, background:'#0a0a14', borderRight:'1px solid #222', overflowY:'auto', flexShrink:0 }}>
          <p style={{ fontSize:10, color:'#666', padding:'8px 10px 4px', textTransform:'uppercase', letterSpacing:1, margin:0 }}>Widgets</p>
          {PALETTE_TYPES.map(type => (
            <button key={type} onClick={() => addWidget(type)}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'none', border:'none', borderBottom:'1px solid #111', color:'#ccc', cursor:'pointer', textAlign:'left', fontSize:11, transition:'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <span style={{ fontSize:14, width:18, textAlign:'center', color: WIDGET_COLORS[type].replace(/[\d.]+\)$/, '0.9)') }}>{WIDGET_ICONS[type]}</span>
              <span style={{ lineHeight:1.2, flex:1 }}>{WIDGET_LABELS[type]}</span>
              <span style={{ color:'#555', fontSize:14 }}>+</span>
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#111', padding:20 }}
          onClick={() => setSelectedId(null)}>
          <div
            ref={canvasRef}
            style={{
              position:'relative',
              background: themeColors.background ?? '#0a0a0a',
              border:`2px solid ${selectedId ? '#7c3aed' : '#333'}`,
              borderRadius:4,
              userSelect:'none',
              cursor:'default',
              aspectRatio: `${aspectRatio}`,
              maxWidth: '100%',
              maxHeight: '100%',
              width: aspectRatio >= 1 ? '100%' : undefined,
              height: aspectRatio < 1 ? '100%' : undefined,
            }}
            onClick={e => e.stopPropagation()}>

            {/* Resolution label */}
            <div style={{ position:'absolute', bottom:4, right:6, fontSize:9, color:'#444', pointerEvents:'none', zIndex:1000 }}>
              {resolution.label}
            </div>

            {/* Grid lines */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'10% 10%', pointerEvents:'none', zIndex:0 }} />

            {/* Widgets */}
            {currentLayout.widgets
              .sort((a, b) => a.z - b.z)
              .map(widget => {
                const isSelected = widget.id === selectedId;
                return (
                  <div key={widget.id}
                    onMouseDown={e => onWidgetMouseDown(e, widget.id)}
                    style={{
                      position:'absolute',
                      left:`${widget.x}%`, top:`${widget.y}%`,
                      width:`${widget.w}%`, height:`${widget.h}%`,
                      zIndex: widget.z + (isSelected ? 100 : 0),
                      background: WIDGET_COLORS[widget.type],
                      border: isSelected ? '2px dashed #fff' : `1px solid ${WIDGET_COLORS[widget.type].replace(/[\d.]+\)$/, '0.6)')}`,
                      borderRadius:3,
                      cursor:'move',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      flexDirection:'column', gap:2,
                      opacity: widget.visible ? 1 : 0.3,
                      overflow:'hidden',
                      boxSizing:'border-box',
                    }}>
                    <span style={{ fontSize:'clamp(8px,1.5vw,13px)', pointerEvents:'none', color:'#fff', fontWeight:600, textAlign:'center', textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}>
                      {WIDGET_ICONS[widget.type]}
                    </span>
                    <span style={{ fontSize:'clamp(7px,1.1vw,10px)', pointerEvents:'none', color:'rgba(255,255,255,0.8)', textAlign:'center', lineHeight:1.2 }}>
                      {WIDGET_LABELS[widget.type]}
                    </span>

                    {/* Resize handle */}
                    {isSelected && (
                      <div data-resize="1"
                        onMouseDown={e => onResizeMouseDown(e, widget.id)}
                        style={{ position:'absolute', bottom:0, right:0, width:10, height:10, background:'#fff', cursor:'se-resize', borderRadius:'2px 0 3px 0', zIndex:10 }} />
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Properties panel */}
        <div style={{ width:220, background:'#0a0a14', borderLeft:'1px solid #222', overflowY:'auto', flexShrink:0, padding:0 }}>
          {selectedWidget ? (
            <div>
              <div style={{ padding:'10px 12px', borderBottom:'1px solid #1a1a2e', background:'#111' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#c084fc' }}>{WIDGET_LABELS[selectedWidget.type]}</span>
                <span style={{ fontSize:10, color:'#555', marginLeft:6 }}>#{selectedWidget.id}</span>
              </div>
              <div style={{ padding:12 }}>
                {/* Position & size */}
                <p style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>Posición</p>
                {numInput('X (%)', selectedWidget.x, v => updateWidget(selectedWidget.id, { x: v }), 0, 100 - selectedWidget.w)}
                {numInput('Y (%)', selectedWidget.y, v => updateWidget(selectedWidget.id, { y: v }), 0, 100 - selectedWidget.h)}
                {numInput('Ancho (%)', selectedWidget.w, v => updateWidget(selectedWidget.id, { w: v }), 5, 100 - selectedWidget.x)}
                {numInput('Alto (%)', selectedWidget.h, v => updateWidget(selectedWidget.id, { h: v }), 4, 100 - selectedWidget.y)}
                {numInput('Z-index', selectedWidget.z, v => updateWidget(selectedWidget.id, { z: Math.round(v) }), 0, 20, 1)}

                {/* Visible toggle */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, marginBottom:12 }}>
                  <label style={{ fontSize:11, color:'#aaa' }}>Visible</label>
                  <button onClick={() => updateWidget(selectedWidget.id, { visible: !selectedWidget.visible })}
                    style={{ padding:'3px 10px', background: selectedWidget.visible ? '#1a3a1a' : '#3a1a1a', border:`1px solid ${selectedWidget.visible ? '#0c0' : '#f66'}`, borderRadius:4, color: selectedWidget.visible ? '#0c0' : '#f66', cursor:'pointer', fontSize:11 }}>
                    {selectedWidget.visible ? 'Sí' : 'No'}
                  </button>
                </div>

                {/* Type-specific config */}
                {selectedWidget.type === 'system-wheel' && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>Estilo</p>
                    {(['carousel','grid','list'] as const).map(s => (
                      <button key={s} onClick={() => updateConfig(selectedWidget.id, 'style', s)}
                        style={{ display:'block', width:'100%', padding:'5px 8px', marginBottom:4, background: selectedWidget.config.style === s ? '#ff6b0033' : '#1a1a2e', border:`1px solid ${selectedWidget.config.style === s ? '#ff6b00' : '#333'}`, borderRadius:4, color: selectedWidget.config.style === s ? '#ff6b00' : '#aaa', cursor:'pointer', fontSize:11, textAlign:'left' }}>
                        {s === 'carousel' ? 'Carrusel 3D' : s === 'grid' ? 'Cuadrícula' : 'Lista'}
                      </button>
                    ))}
                  </div>
                )}

                {selectedWidget.type === 'system-logo' && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>Logo</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <label style={{ fontSize:11, color:'#aaa' }}>Usar PNG</label>
                      <button onClick={() => updateConfig(selectedWidget.id, 'use_png', !selectedWidget.config.use_png)}
                        style={{ padding:'3px 10px', background: selectedWidget.config.use_png ? '#1a3a1a' : '#1a1a2e', border:`1px solid ${selectedWidget.config.use_png ? '#0c0' : '#444'}`, borderRadius:4, color: selectedWidget.config.use_png ? '#0c0' : '#aaa', cursor:'pointer', fontSize:11 }}>
                        {selectedWidget.config.use_png ? 'Sí' : 'No'}
                      </button>
                    </div>
                    <p style={{ fontSize:10, color:'#555', margin:'2px 0 6px', lineHeight:1.4 }}>
                      Coloca PNGs en <code style={{ color:'#7c3aed' }}>assets/systems/</code> con el nombre del sistema.
                    </p>
                    <label style={{ fontSize:11, color:'#aaa', display:'block', marginBottom:4 }}>Fallback</label>
                    {(['initial','text'] as const).map(f => (
                      <button key={f} onClick={() => updateConfig(selectedWidget.id, 'fallback', f)}
                        style={{ display:'inline-block', marginRight:6, padding:'4px 10px', background: selectedWidget.config.fallback === f ? '#0078d433' : '#1a1a2e', border:`1px solid ${selectedWidget.config.fallback === f ? '#0078d4' : '#333'}`, borderRadius:4, color: selectedWidget.config.fallback === f ? '#0078d4' : '#aaa', cursor:'pointer', fontSize:11 }}>
                        {f === 'initial' ? 'Inicial' : 'Nombre completo'}
                      </button>
                    ))}
                  </div>
                )}

                {selectedWidget.type === 'text-label' && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>Texto</p>
                    <textarea value={(selectedWidget.config.text as string) ?? ''} rows={2}
                      onChange={e => updateConfig(selectedWidget.id, 'text', e.target.value)}
                      style={{ width:'100%', padding:'5px 8px', background:'#0d0d1a', border:'1px solid #444', borderRadius:4, color:'#eee', fontSize:11, boxSizing:'border-box', resize:'vertical' }} />
                    <label style={{ fontSize:11, color:'#aaa', display:'block', margin:'6px 0 3px' }}>Fuente</label>
                    <select value={(selectedWidget.config.font as string) ?? 'ui'}
                      onChange={e => updateConfig(selectedWidget.id, 'font', e.target.value)}
                      style={{ width:'100%', padding:'4px 8px', background:'#0d0d1a', border:'1px solid #444', borderRadius:4, color:'#eee', fontSize:11 }}>
                      {['ui','title','mono'].map(f => (
                        <option key={f} value={f} style={{ fontFamily: themeFonts[f] }}>{f} — {themeFonts[f] ?? f}</option>
                      ))}
                    </select>
                    {numInput('Tamaño (px)', (selectedWidget.config.size as number) ?? 16, v => updateConfig(selectedWidget.id, 'size', v), 8, 72, 2)}
                    <label style={{ fontSize:11, color:'#aaa', display:'block', margin:'4px 0 3px' }}>Color</label>
                    <div style={{ display:'flex', gap:6 }}>
                      <input type="color" value={(selectedWidget.config.color as string) ?? '#ffffff'} onChange={e => updateConfig(selectedWidget.id, 'color', e.target.value)} />
                      <input type="text" value={(selectedWidget.config.color as string) ?? '#ffffff'} onChange={e => updateConfig(selectedWidget.id, 'color', e.target.value)}
                        style={{ flex:1, padding:'3px 6px', background:'#0d0d1a', border:'1px solid #444', borderRadius:4, color:'#eee', fontSize:11 }} />
                    </div>
                  </div>
                )}

                {selectedWidget.type === 'image' && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>Imagen</p>
                    <input type="text" value={(selectedWidget.config.src as string) ?? ''} placeholder="assets/banner.png"
                      onChange={e => updateConfig(selectedWidget.id, 'src', e.target.value)}
                      style={{ width:'100%', padding:'5px 8px', background:'#0d0d1a', border:'1px solid #444', borderRadius:4, color:'#eee', fontSize:11, boxSizing:'border-box' }} />
                    <label style={{ fontSize:11, color:'#aaa', display:'block', margin:'6px 0 3px' }}>Ajuste</label>
                    {(['contain','cover','fill'] as const).map(f => (
                      <button key={f} onClick={() => updateConfig(selectedWidget.id, 'fit', f)}
                        style={{ display:'inline-block', marginRight:4, marginBottom:4, padding:'4px 8px', background: selectedWidget.config.fit === f ? '#1a2a3a' : '#1a1a2e', border:`1px solid ${selectedWidget.config.fit === f ? '#0af' : '#333'}`, borderRadius:4, color: selectedWidget.config.fit === f ? '#0af' : '#aaa', cursor:'pointer', fontSize:10 }}>
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                {/* Delete */}
                <button onClick={deleteSelected}
                  style={{ width:'100%', marginTop:16, padding:'7px 0', background:'#2a0a0a', border:'1px solid #f44', borderRadius:4, color:'#f66', cursor:'pointer', fontSize:11 }}>
                  Eliminar widget
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding:16, color:'#555', fontSize:12, textAlign:'center', marginTop:24 }}>
              <p>Selecciona un widget en el canvas para editar sus propiedades</p>
              <p style={{ fontSize:10, marginTop:8, color:'#444' }}>Arrastra para mover · Esquina inferior-derecha para redimensionar · Supr para eliminar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
