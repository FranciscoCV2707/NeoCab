import React, { useState } from 'react';
import { SystemManager } from './SystemManager';
import { ThemeEditor } from '../studio/ThemeEditor';
import { InputWizard } from '../operator/InputWizard';
import KeymapConfigPanel from '../operator/KeymapConfig';
import { ScraperCredentialsPanel } from './ScraperCredentialsPanel';
import '../operator/OperatorPanel.css';

type SettingsTab = 'systems' | 'theme' | 'controls' | 'keymap' | 'scraper';

interface SettingsPanelProps {
    onBack: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('systems');

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
                {activeTab === 'theme' && <ThemeEditor />}
                {activeTab === 'controls' && <InputWizard />}
                {activeTab === 'keymap' && <KeymapConfigPanel />}
                {activeTab === 'scraper' && (
                    <div className="tab-pane">
                        <h3>Credenciales del Scraper</h3>
                        <ScraperCredentialsPanel />
                    </div>
                )}
            </div>
        </div>
    );
};
