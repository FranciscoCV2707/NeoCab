import React, { useState, useEffect } from 'react';
import './TimeoutWarning.css';

interface TimeoutWarningProps {
  enabled?: boolean;
  warnBeforeSeconds?: number;
  autoClose?: boolean;
  remainingSeconds?: number;
}

export const TimeoutWarning: React.FC<TimeoutWarningProps> = ({
  enabled = true,
  warnBeforeSeconds = 30,
  autoClose = true,
  remainingSeconds,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [remainingSeconds]);

  if (!enabled || remainingSeconds === undefined || remainingSeconds > warnBeforeSeconds || dismissed) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className={`timeout-warning ${remainingSeconds <= 10 ? 'critical' : ''}`}>
      <div className="timer-value">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="timer-label">Time remaining</div>
      {autoClose && remainingSeconds <= 10 && (
        <div className="warning-text">Insert coins to continue!</div>
      )}
      <button className="dismiss-btn" onClick={() => setDismissed(true)}>
        Dismiss
      </button>
    </div>
  );
};
