import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '../../i18n';
import './SafeQuitRules.css';

interface SafeQuitRule {
    id: number;
    emulator: string;
    game_pattern: string | null;
    monitor_type: string;
    timeout_seconds: number;
    action: string;
    enabled: boolean;
}

const DEFAULT_RULES: Record<string, Partial<SafeQuitRule>> = {
    'mame': { timeout_seconds: 1800, action: 'ShowAttract' },
    'retroarch': { timeout_seconds: 3600, action: 'ShowAttract' },
    'pcsx2': { timeout_seconds: 3600, action: 'ShowAttract' },
    'dolphin': { timeout_seconds: 3600, action: 'ShowAttract' },
    'duckstation': { timeout_seconds: 3600, action: 'ShowAttract' },
};

const EMULATORS = ['mame', 'retroarch', 'pcsx2', 'dolphin', 'duckstation', 'xenia'];
const ACTIONS = ['ShowAttract', 'ReturnToMenu', 'Shutdown', 'RestartGame'];

export const SafeQuitRulesPanel: React.FC = () => {
    useTranslation();
    const [rules, setRules] = useState<SafeQuitRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedRule, setSelectedRule] = useState<SafeQuitRule | null>(null);
    const [testOutput, setTestOutput] = useState<string>('');

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        try {
            const result = await invoke<string>('safe_quit_get_rules', { emulator: 'mame' });
            const data = JSON.parse(result);
            setRules(Array.isArray(data) ? data : [data]);
        } catch (err) {
            console.error('Failed to load safe quit rules:', err);
            const defaultRules = EMULATORS.map((emu, i) => ({
                id: i + 1,
                emulator: emu,
                game_pattern: null,
                monitor_type: 'timeout',
                timeout_seconds: DEFAULT_RULES[emu]?.timeout_seconds ?? 3600,
                action: DEFAULT_RULES[emu]?.action ?? 'ShowAttract',
                enabled: true,
            }));
            setRules(defaultRules);
        } finally {
            setLoading(false);
        }
    };

const saveRule = async (rule: SafeQuitRule) => {
        // Frontend-only storage for now (DB persistence not implemented)
        console.log('Saving rule:', rule);
        setSaving(false);
    };

    const deleteRule = async (id: number) => {
        setRules(prev => prev.filter(r => r.id !== id));
        setSelectedRule(null);
    };

    const testRule = async (rule: SafeQuitRule) => {
        try {
            const result = await invoke<string>('safe_quit_check', {
                emulator: rule.emulator,
                elapsed_seconds: rule.timeout_seconds,
            });
            const data = JSON.parse(result);
            setTestOutput(`${rule.emulator}: elapsed=${data.elapsed_seconds}s → action="${data.action}", active=${data.active}`);
        } catch (err) {
            setTestOutput(`Error testing rule: ${err}`);
        }
    };

    const updateRule = (id: number, updates: Partial<SafeQuitRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const addNewRule = () => {
        const newRule: SafeQuitRule = {
            id: Date.now(),
            emulator: 'mame',
            game_pattern: null,
            monitor_type: 'timeout',
            timeout_seconds: 3600,
            action: 'ShowAttract',
            enabled: true,
        };
        setRules(prev => [...prev, newRule]);
        setSelectedRule(newRule);
    };

    if (loading) {
        return <div className="safe-quit-panel"><p>Cargando reglas...</p></div>;
    }

    return (
        <div className="safe-quit-panel">
            <div className="panel-header">
                <h3>Safe Quit Rules</h3>
                <button className="add-rule-btn" onClick={addNewRule}>+ Nueva Regla</button>
            </div>

            <div className="rules-list">
                {rules.map(rule => (
                    <div
                        key={rule.id}
                        className={`rule-card ${selectedRule?.id === rule.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRule(rule)}
                    >
                        <div className="rule-info">
                            <span className="rule-emulator">{rule.emulator}</span>
                            <span className="rule-time">{rule.timeout_seconds}s</span>
                        </div>
                        <div className="rule-actions">
                            <span className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                                {rule.enabled ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedRule && (
                <div className="rule-editor">
                    <h4>Editando: {selectedRule.emulator}</h4>

                    <div className="editor-field">
                        <label>Emulador</label>
                        <select
                            value={selectedRule.emulator}
                            onChange={(e) => updateRule(selectedRule.id, { emulator: e.target.value })}
                        >
                            {EMULATORS.map(emu => (
                                <option key={emu} value={emu}>{emu}</option>
                            ))}
                        </select>
                    </div>

                    <div className="editor-field">
                        <label>Patrón de Juego (regex opcional)</label>
                        <input
                            type="text"
                            value={selectedRule.game_pattern || ''}
                            onChange={(e) => updateRule(selectedRule.id, { game_pattern: e.target.value || null })}
                            placeholder=".*"
                        />
                    </div>

                    <div className="editor-field">
                        <label>Timeout (segundos)</label>
                        <input
                            type="number"
                            value={selectedRule.timeout_seconds}
                            onChange={(e) => updateRule(selectedRule.id, { timeout_seconds: parseInt(e.target.value) || 3600 })}
                        />
                    </div>

                    <div className="editor-field">
                        <label>Acción</label>
                        <select
                            value={selectedRule.action}
                            onChange={(e) => updateRule(selectedRule.id, { action: e.target.value })}
                        >
                            {ACTIONS.map(act => (
                                <option key={act} value={act}>{act}</option>
                            ))}
                        </select>
                    </div>

                    <div className="editor-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedRule.enabled}
                                onChange={(e) => updateRule(selectedRule.id, { enabled: e.target.checked })}
                            />
                            Habilitado
                        </label>
                    </div>

                    <div className="editor-buttons">
                        <button onClick={() => {
                            const updated = rules.find(r => r.id === selectedRule.id);
                            if (updated) saveRule(updated);
                        }} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => testRule(selectedRule)}>Test</button>
                        <button onClick={() => deleteRule(selectedRule.id)} className="delete-btn">Eliminar</button>
                    </div>

                    {testOutput && (
                        <div className="test-output">
                            <pre>{testOutput}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};