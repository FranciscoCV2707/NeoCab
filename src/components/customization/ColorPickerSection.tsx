import React from 'react';
import './ColorPickerSection.css';

interface ColorPickerSectionProps {
  title: string;
  colors: { [key: string]: string };
  onChange: (colorKey: string, value: string) => void;
}

export const ColorPickerSection: React.FC<ColorPickerSectionProps> = ({
  title,
  colors,
  onChange
}) => {
  return (
    <div className="color-picker-section">
      <h3 className="section-title">{title}</h3>
      <div className="color-grid">
        {Object.entries(colors).map(([key, value]) => (
          <div key={key} className="color-item">
            <label>{key}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                className="color-input"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                className="color-hex"
                placeholder="#000000"
              />
            </div>
            <div
              className="color-preview"
              style={{ backgroundColor: value }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
