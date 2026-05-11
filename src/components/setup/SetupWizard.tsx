import React, { useState } from 'react';
import { WelcomeStep } from './steps/WelcomeStep';
import { RomDirectoryStep } from './steps/RomDirectoryStep';
import { MediaDirectoryStep } from './steps/MediaDirectoryStep';
import { SystemsStep } from './steps/SystemsStep';
import { ConfigureInputStep } from './steps/ConfigureInputStep';
import { OperatorPinStep } from './steps/OperatorPinStep';
import { ReviewStep } from './steps/ReviewStep';
import './SetupWizard.css';

interface SetupConfig {
  romDirectory: string;
  mediaDirectory: string;
  selectedSystems: string[];
  inputDevice: string;
  operatorPin: string;
  autoboot: boolean;
  kioskMode: boolean;
  theme: string;
}

interface SetupWizardProps {
  onComplete?: (config: SetupConfig) => Promise<void>;
  onCancel?: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'rom-directory', title: 'ROM Directory' },
  { id: 'media-directory', title: 'Media Directory' },
  { id: 'systems', title: 'Select Systems' },
  { id: 'input', title: 'Configure Input' },
  { id: 'pin', title: 'Operator PIN' },
  { id: 'review', title: 'Review' },
];

const DEFAULT_CONFIG: SetupConfig = {
  romDirectory: '',
  mediaDirectory: './media',
  selectedSystems: ['mame', 'nes', 'snes'],
  inputDevice: 'auto',
  operatorPin: '0000',
  autoboot: false,
  kioskMode: false,
  theme: 'classic',
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<SetupConfig>(DEFAULT_CONFIG);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      setError(null);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleComplete = async () => {
    if (!validateStep()) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      if (onComplete) {
        await onComplete(config);
      }
      // onComplete should handle navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setIsCompleting(false);
    }
  };

  const validateStep = (): boolean => {
    switch (STEPS[currentStep].id) {
      case 'rom-directory':
        if (!config.romDirectory.trim()) {
          setError('Please specify a ROM directory');
          return false;
        }
        break;
      case 'systems':
        if (config.selectedSystems.length === 0) {
          setError('Please select at least one system');
          return false;
        }
        break;
      case 'pin':
        if (config.operatorPin.length !== 4 || !/^\d+$/.test(config.operatorPin)) {
          setError('PIN must be exactly 4 digits');
          return false;
        }
        break;
    }
    return true;
  };

  const updateConfig = (updates: Partial<SetupConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'rom-directory':
        return (
          <RomDirectoryStep
            value={config.romDirectory}
            onChange={(romDirectory) => updateConfig({ romDirectory })}
          />
        );
      case 'media-directory':
        return (
          <MediaDirectoryStep
            value={config.mediaDirectory}
            onChange={(mediaDirectory) => updateConfig({ mediaDirectory })}
          />
        );
      case 'systems':
        return (
          <SystemsStep
            selectedSystems={config.selectedSystems}
            onChange={(selectedSystems) => updateConfig({ selectedSystems })}
          />
        );
      case 'input':
        return (
          <ConfigureInputStep
            value={config.inputDevice}
            onChange={(inputDevice) => updateConfig({ inputDevice })}
          />
        );
      case 'pin':
        return (
          <OperatorPinStep
            value={config.operatorPin}
            onChange={(operatorPin) => updateConfig({ operatorPin })}
          />
        );
      case 'review':
        return <ReviewStep config={config} />;
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="setup-wizard">
      <div className="wizard-header">
        <h1>NeoCab Setup Wizard</h1>
        <p>Configure your arcade cabinet</p>
      </div>

      <div className="wizard-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>

      <div className="wizard-steps-nav">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`step-indicator ${idx === currentStep ? 'active' : ''} ${
              idx < currentStep ? 'completed' : ''
            }`}
          >
            <div className="step-number">{idx === currentStep ? '●' : idx < currentStep ? '✓' : idx + 1}</div>
            <div className="step-label">{step.title}</div>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="step-content">{renderStep()}</div>
      </div>

      <div className="wizard-footer">
        <button
          className="btn-cancel"
          onClick={onCancel}
          disabled={isCompleting}
        >
          Cancel
        </button>

        <div className="navigation-buttons">
          <button
            className="btn-previous"
            onClick={handlePrevious}
            disabled={isFirstStep || isCompleting}
          >
            ← Previous
          </button>

          {isLastStep ? (
            <button
              className="btn-complete"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? 'Completing...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              className="btn-next"
              onClick={handleNext}
              disabled={isCompleting}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
