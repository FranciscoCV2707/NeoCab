import { useState, useEffect } from "react";
import { t } from "../i18n";
import "./PinPad.css";

interface PinPadProps {
  expectedPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinPad({ expectedPin, onSuccess, onCancel }: PinPadProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === expectedPin.length) {
      if (pin === expectedPin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 1000);
      }
    }
  }, [pin, expectedPin, onSuccess]);

  const handleInput = (digit: string) => {
    if (pin.length < expectedPin.length && !error) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="pinpad-overlay">
      <div className="pinpad-container">
        <h2>{t('OPERATOR_PANEL')}</h2>
        <p>ENTER OPERATOR PIN</p>
        
        <div className={`pin-display ${error ? 'error' : ''}`}>
          {Array.from({ length: expectedPin.length }).map((_, i) => (
            <span key={i} className="pin-dot">
              {i < pin.length ? '●' : '○'}
            </span>
          ))}
        </div>

        <div className="pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} className="pin-btn" onClick={() => handleInput(num.toString())}>
              {num}
            </button>
          ))}
          <button className="pin-btn action" onClick={handleBackspace}>⌫</button>
          <button className="pin-btn" onClick={() => handleInput("0")}>0</button>
          <button className="pin-btn action cancel" onClick={onCancel}>✕</button>
        </div>
      </div>
    </div>
  );
}
