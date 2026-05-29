import React, { useState } from 'react';
import { SystemManager } from './SystemManager';
import { InputWizard } from '../operator/InputWizard';
import KeymapConfigPanel from '../operator/KeymapConfig';
import { ScraperPanel } from './ScraperPanel';
import { EmulatorSetupPanel } from './EmulatorSetupPanel';
import { ThemeEditor } from '../studio/ThemeEditor';
import { useThemeStore } from '../../stores/useThemeStore';
import { THEME_REGISTRY } from '../../themes/registry';
import '../operator/OperatorPanel.css';

export type SettingsTab = 'systems' | 'theme' | 'controls' | 'keymap' | 'scraper' | 'emulators';

interface SettingsPanelProps {
    onBack: () => void;
    onOpenThemeSwitcher?: () => void;
    initialTab?: SettingsTab;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack, onOpenThemeSwitcher, initialTab }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'systems');
    const currentTheme = useThemeStore(s => s.currentTheme);
    const activeId = currentTheme?.name?.toLowerCase().replace(/\s+/g, '') ?? 'hyperrush';
    const activeEntry = THEME_REGISTRY.find(t => t.id === activeId);

    return (
        <div className="operator-panel">
            <nav className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'systems' ? 'active' : ''}`}
                    onClick={() => setActiveTab('systems')}
                >
                    Sistemas
                </button>
                <button
                    className={`tab-button ${activeTab === 'theme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                >
                    Apariencia
                </button>
                <button
                    className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
                    onClick={() => setActiveTab('controls')}
                >
                    Controles
                </button>
                <button
                    className={`tab-button ${activeTab === 'keymap' ? 'active' : ''}`}
                    onClick={() => setActiveTab('keymap')}
                >
                    Teclado
                </button>
                <button
                    className={`tab-button ${activeTab === 'scraper' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scraper')}
                >
                    Scraper
                </button>
                <button
                    className={`tab-button ${activeTab === 'emulators' ? 'active' : ''}`}
                    onClick={() => setActiveTab('emulators')}
                >
                    Emuladores
                </button>
                <button className="tab-button manual-button" onClick={onBack}>
                    Volver
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'systems' && (
                    <div className="tab-pane">
                        <h3>Configuracion de Sistemas</h3>
                        <SystemManager />
                    </div>
                )}
                {activeTab === 'theme' && (
                    <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>
                                    Tema activo: <span style={{ color: activeEntry ? activeEntry.accent : '#fff' }}>{activeEntry?.name ?? currentTheme?.name ?? '—'}</span>
                                </div>
                                <div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{activeEntry?.tagline ?? 'Personaliza colores, fuentes, efectos y layout abajo'}</div>
                            </div>
                            <button
                                onClick={onOpenThemeSwitcher}
                                style={{
                                    padding: '10px 22px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)',
                                    color: '#fff', fontFamily: 'inherit', fontSize: 13, letterSpacing: '.08em',
                                    cursor: 'pointer', textTransform: 'uppercase', borderRadius: 4,
                                }}
                            >
                                Cambiar tema (T)
                            </button>
                        </div>
                        <ThemeEditor />
                    </div>
                )}
                {activeTab === 'controls' && <InputWizard />}
                {activeTab === 'keymap' && <KeymapConfigPanel />}
                {activeTab === 'scraper' && (
                    <div className="tab-pane">
                        <h3>Credenciales del Scraper</h3>
                        <ScraperPanel />
                    </div>
                )}
                {activeTab === 'emulators' && (
                    <div className="tab-pane">
                        <h3>Configuracion de Emuladores</h3>
                        <EmulatorSetupPanel />
                    </div>
                )}
            </div>
        </div>
    );
};
