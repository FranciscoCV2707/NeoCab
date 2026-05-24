import React, { useState } from 'react';
import { Theme } from '../../stores/useThemeStore';

interface Props {
  currentTheme: Theme;
  onLoad: (theme: Theme) => void;
  onClose: () => void;
}

const SCHEMA_COMMENT = `{
  "name": "Mi Tema",
  "version": "1.0.0",
  "author": "Tu Nombre",
  "style": "arcade",
  "description": "Descripción breve",
  "colors": {
    "primary": "#ff6b00",
    "secondary": "#1a1a1a",
    "accent": "#00ffcc",
    "text": "#ffffff",
    "background": "#0a0a0a",
    "surface": "#1a1a1a",
    "border": "#ff6b00",
    "highlight": "#ff8c00",
    "success": "#00c853",
    "warning": "#ffcc00",
    "error": "#ff1744"
  },
  "fonts": {
    "ui": "Arial",
    "title": "Impact",
    "subtitle": "Arial",
    "mono": "Consolas",
    "google_font": ""
  },
  "background": {
    "type": "color",
    "color": "#0a0a0a",
    "gradient": "",
    "image": "",
    "video": "",
    "opacity": 1.0,
    "blur": 0,
    "overlay_color": ""
  },
  "layout": {
    "system_view": "carousel",
    "game_view": "split",
    "wheel_style": "3d",
    "transition": "slide",
    "animation_speed": 300,
    "easing": "easeOutCubic"
  },
  "wheel": {
    "item_size": 120,
    "item_spacing": 15,
    "animation_duration": 300,
    "selected_color": "#ff6b00",
    "unselected_color": "#444444",
    "selected_scale": 1.15,
    "glow_selected": true
  },
  "effects": {
    "scanlines": false,
    "crt_curve": 0.0,
    "glow_intensity": 0.7,
    "shadow_enabled": true,
    "vignette": 0.0,
    "noise": 0.0,
    "blur_unselected": 0
  },
  "overlay": {
    "coin_position": "top-right",
    "timer_position": "bottom-right",
    "stats_opacity": 0.8,
    "animation_style": "smooth"
  },
  "media": {
    "video_enabled": true,
    "video_loop": true,
    "snap_type": "video",
    "marquee_enabled": true,
    "wheel_enabled": true,
    "box_art_enabled": true
  },
  "sounds": {
    "navigate": "nav.wav",
    "select": "select.wav",
    "back": "back.wav",
    "coin": "coin.wav",
    "start": "start.wav"
  }
}`;

function buildPrompt(description: string): string {
  return `Eres un diseñador de temas para NeoCab, un OS de gabinete arcade.
Genera un theme.json válido basado en esta descripción: "${description}"

El JSON debe seguir EXACTAMENTE esta estructura. Responde SOLO con el JSON, sin texto extra, sin markdown, sin backticks:

${SCHEMA_COMMENT}

Restricciones:
- Todos los colores son hex (#rrggbb o #rrggbbaa)
- animation_speed: 100-1000 (ms)
- glow_intensity, crt_curve, vignette, noise: 0.0-1.0
- blur_unselected: 0-8 (px)
- system_view: "carousel" | "grid" | "list"
- game_view: "split" | "full" | "compact"
- wheel_style: "3d" | "flat" | "hidden"
- transition: "slide" | "fade" | "scale" | "flip" | "glitch" | "zoom"
- background.type: "color" | "gradient" | "image" | "video"
- google_font: nombre exacto de Google Fonts (ej: "Press Start 2P", "Orbitron") o "" para ninguna
- style: "arcade" | "neon" | "minimal" | "crt" | "cyberpunk" | "custom"`;
}

function validateJson(raw: string): { ok: boolean; theme?: Theme; error?: string } {
  try {
    const parsed = JSON.parse(raw) as Theme;
    if (!parsed.name || !parsed.colors || !parsed.layout) {
      return { ok: false, error: 'Faltan campos requeridos: name, colors, layout' };
    }
    return { ok: true, theme: parsed };
  } catch (e) {
    return { ok: false, error: `JSON inválido: ${(e as Error).message}` };
  }
}

export const ThemeAIHelper: React.FC<Props> = ({ onLoad, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(description || 'un tema de gabinete arcade retro con colores neón');

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    if (val.trim()) {
      const result = validateJson(val);
      setValidationError(result.ok ? null : (result.error ?? 'Error desconocido'));
    } else {
      setValidationError(null);
    }
  };

  const handleLoad = () => {
    const result = validateJson(jsonInput);
    if (result.ok && result.theme) {
      onLoad(result.theme);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const modalStyle: React.CSSProperties = {
    background: '#0d0d1a',
    border: '1px solid #444',
    borderRadius: 10,
    width: 560,
    maxWidth: '95vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#eee' }}>Crear tema con IA</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {([1, 2, 3] as const).map(n => (
              <button key={n} onClick={() => setStep(n)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: step === n ? '#7c3aed' : '#333',
                  color: step === n ? '#fff' : '#888', fontWeight: 700, fontSize: 12,
                }}>
                {n}
              </button>
            ))}
            <button onClick={onClose}
              style={{ marginLeft: 8, background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {step === 1 && (
            <>
              <h3 style={{ margin: '0 0 8px', color: '#eee', fontSize: 14 }}>Paso 1 — Describe tu tema</h3>
              <p style={{ color: '#888', fontSize: 12, margin: '0 0 12px' }}>
                Describe el estilo visual que quieres. Luego copia el prompt y pégalo en Claude, ChatGPT u otra IA.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: quiero un tema estilo máquina arcade de los 80s con colores neón, fondo oscuro con líneas de cuadrícula púrpura y texto en verde fosforescente..."
                style={{
                  width: '100%', height: 90, padding: 10, boxSizing: 'border-box',
                  background: '#1a1a2e', border: '1px solid #555', borderRadius: 6,
                  color: '#eee', fontSize: 12, resize: 'vertical', fontFamily: 'inherit',
                }}
              />
              <div style={{ marginTop: 12 }}>
                <p style={{ color: '#666', fontSize: 11, margin: '0 0 6px' }}>Prompt generado (copia esto a la IA):</p>
                <pre style={{
                  background: '#111', border: '1px solid #333', borderRadius: 6,
                  padding: 10, fontSize: 10, color: '#aaa', overflow: 'auto',
                  maxHeight: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                }}>
                  {prompt}
                </pre>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ margin: '0 0 8px', color: '#eee', fontSize: 14 }}>Paso 2 — Pega el JSON generado</h3>
              <p style={{ color: '#888', fontSize: 12, margin: '0 0 12px' }}>
                Pega aquí el JSON que te devolvió la IA. Se valida en tiempo real.
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={'{\n  "name": "Mi Tema",\n  ...\n}'}
                style={{
                  width: '100%', height: 280, padding: 10, boxSizing: 'border-box',
                  background: '#111', border: `1px solid ${validationError ? '#f66' : jsonInput && !validationError ? '#0c0' : '#555'}`,
                  borderRadius: 6, color: '#eee', fontSize: 11, resize: 'vertical',
                  fontFamily: 'Consolas, monospace',
                }}
              />
              {validationError && (
                <p style={{ color: '#f66', fontSize: 11, margin: '6px 0 0' }}>{validationError}</p>
              )}
              {jsonInput && !validationError && (
                <p style={{ color: '#0c0', fontSize: 11, margin: '6px 0 0' }}>JSON válido</p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ margin: '0 0 8px', color: '#eee', fontSize: 14 }}>Paso 3 — Cargar en editor</h3>
              <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>
                Al cargar, todos los campos del editor se llenarán con el tema de la IA. Podrás ajustar lo que quieras antes de guardar.
              </p>
              {jsonInput && !validationError ? (
                <div style={{ background: '#1a2a1a', border: '1px solid #0c0', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <p style={{ color: '#0c0', fontSize: 12, margin: 0 }}>JSON listo para cargar</p>
                  <p style={{ color: '#888', fontSize: 11, margin: '4px 0 0' }}>
                    Nombre: {(() => { try { return JSON.parse(jsonInput).name; } catch { return '—'; } })()}
                  </p>
                </div>
              ) : (
                <div style={{ background: '#2a1a1a', border: '1px solid #f66', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <p style={{ color: '#f88', fontSize: 12, margin: 0 }}>Vuelve al Paso 2 y pega un JSON válido</p>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid #333', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {step === 1 && (
            <>
              <button onClick={copyPrompt}
                style={{ padding: '7px 14px', background: copied ? '#1a3a1a' : '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {copied ? 'Copiado' : 'Copiar prompt'}
              </button>
              <button onClick={() => setStep(2)}
                style={{ padding: '7px 14px', background: '#444', border: 'none', borderRadius: 6, color: '#eee', cursor: 'pointer', fontSize: 12 }}>
                Siguiente
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)}
                style={{ padding: '7px 14px', background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
                Atras
              </button>
              <button onClick={() => setStep(3)} disabled={!jsonInput || !!validationError}
                style={{ padding: '7px 14px', background: jsonInput && !validationError ? '#7c3aed' : '#333', border: 'none', borderRadius: 6, color: jsonInput && !validationError ? '#fff' : '#666', cursor: jsonInput && !validationError ? 'pointer' : 'not-allowed', fontSize: 12 }}>
                Siguiente
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={() => setStep(2)}
                style={{ padding: '7px 14px', background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 12 }}>
                Atras
              </button>
              <button onClick={handleLoad} disabled={!jsonInput || !!validationError}
                style={{ padding: '7px 14px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                Cargar en editor
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
