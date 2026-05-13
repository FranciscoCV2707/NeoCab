import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './InputWizard.css';

interface JoyTrigger {
    kind: 'Button' | 'Axis';
    button?: number;
    axis?: number;
    direction?: 'Positive' | 'Negative';
}

interface JoyMapping {
    trigger: JoyTrigger;
    action: { type: 'Key' | 'ArcadeAction'; value: string };
}

const STEPS = [
    { label: 'Arriba', action: { type: 'Key', value: 'UP' } },
    { label: 'Abajo', action: { type: 'Key', value: 'DOWN' } },
    { label: 'Izquierda', action: { type: 'Key', value: 'LEFT' } },
    { label: 'Derecha', action: { type: 'Key', value: 'RIGHT' } },
    { label: 'Botón 1 (A)', action: { type: 'Key', value: 'LCTRL' } },
    { label: 'Botón 2 (B)', action: { type: 'Key', value: 'LALT' } },
    { label: 'Botón 3 (X)', action: { type: 'Key', value: 'SPACE' } },
    { label: 'Botón 4 (Y)', action: { type: 'Key', value: 'LSHIFT' } },
    { label: 'Insertar Moneda', action: { type: 'ArcadeAction', value: 'InsertCoin' } },
    { label: 'Start P1', action: { type: 'ArcadeAction', value: 'StartGame' } },
];

export const InputWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [mappings, setMappings] = useState<JoyMapping[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [profileName, setProfileName] = useState('custom_profile');
    const [status, setStatus] = useState('Esperando para comenzar...');

    const startRecording = async () => {
        const step = STEPS[currentStep];
        try {
            await invoke('start_recording_input', {
                actionType: step.action.type,
                actionValue: step.action.value
            });
            setIsRecording(true);
            setStatus(`Presiona el botón para: ${step.label}`);
        } catch (err) {
            setStatus(`Error: ${err}`);
        }
    };

    const pollInput = useCallback(async () => {
        if (!isRecording) return;

        try {
            const trigger = await invoke<JoyTrigger | null>('get_recorded_input');
            if (trigger) {
                const newMapping: JoyMapping = {
                    trigger,
                    action: STEPS[currentStep].action as any
                };
                
                setMappings([...mappings, newMapping]);
                setIsRecording(false);
                
                if (currentStep < STEPS.length - 1) {
                    setCurrentStep(currentStep + 1);
                    setStatus(`¡Detectado! Siguiente: ${STEPS[currentStep + 1].label}`);
                } else {
                    setStatus('¡Mapeo completado! Ya puedes guardar.');
                }
            }
        } catch (err) {
            console.error('Error polling input:', err);
        }
    }, [isRecording, currentStep, mappings]);

    useEffect(() => {
        let interval: number;
        if (isRecording) {
            interval = window.setInterval(pollInput, 200);
        }
        return () => clearInterval(interval);
    }, [isRecording, pollInput]);

    const saveProfile = async () => {
        try {
            await invoke('save_recorded_profile', {
                profileName,
                mappings
            });
            setStatus(`Perfil '${profileName}' guardado y activado.`);
        } catch (err) {
            setStatus(`Error al guardar: ${err}`);
        }
    };

    const resetWizard = () => {
        setCurrentStep(0);
        setMappings([]);
        setIsRecording(false);
        setStatus('Wizard reiniciado.');
    };

    return (
        <div className="input-wizard">
            <h3>Asistente de Mapeo Arcade</h3>
            <p className="status-text">{status}</p>

            <div className="wizard-controls">
                <div className="step-indicator">
                    Paso {currentStep + 1} de {STEPS.length}: <strong>{STEPS[currentStep].label}</strong>
                </div>

                {!isRecording && currentStep < STEPS.length && (
                    <button onClick={startRecording} className="record-button">
                        ⏺️ Iniciar Grabación
                    </button>
                )}

                {currentStep === STEPS.length - 1 && mappings.length === STEPS.length && (
                    <div className="save-section">
                        <input 
                            type="text" 
                            value={profileName} 
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Nombre del perfil"
                        />
                        <button onClick={saveProfile} className="save-button">
                            💾 Guardar Perfil
                        </button>
                    </div>
                )}

                <button onClick={resetWizard} className="reset-button">
                    🔄 Reiniciar
                </button>
            </div>

            <div className="mappings-preview">
                <h4>Resumen de Mapeo:</h4>
                <ul>
                    {mappings.map((m, i) => (
                        <li key={i}>
                            {STEPS[i].label} → {m.trigger.kind === 'Button' ? `Botón ${m.trigger.button}` : `Eje ${m.trigger.axis} ${m.trigger.direction}`}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
