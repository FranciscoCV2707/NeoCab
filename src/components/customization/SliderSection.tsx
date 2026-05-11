import React from 'react';
import './SliderSection.css';

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

interface SliderSectionProps {
  title: string;
  sliders: SliderConfig[];
  values: { [key: string]: number };
  onChange: (key: string, value: number) => void;
}

export const SliderSection: React.FC<SliderSectionProps> = ({
  title,
  sliders,
  values,
  onChange
}) => {
  return (
    <div className="slider-section">
      <h3 className="section-title">{title}</h3>
      <div className="slider-list">
        {sliders.map(({ key, label, min, max, step, unit = '' }) => (
          <div key={key} className="slider-item">
            <div className="slider-header">
              <label>{label}</label>
              <span className="slider-value">
                {values[key] || 0}{unit}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={values[key] || min}
              onChange={(e) => onChange(key, parseFloat(e.target.value))}
              className="slider-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
