import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./ShaderSelector.css";

interface Preset {
  name: string;
}

export default function ShaderSelector() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<string>("arcade");

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await invoke<string>("list_shader_presets");
        const data = JSON.parse(res);
        if (data.success) {
          setPresets(data.presets);
        }
      } catch (err) {
        console.error("Failed to load presets", err);
      }
    };
    loadPresets();
  }, []);

  const selectPreset = async (name: string) => {
    setActivePreset(name);
    try {
      await invoke("get_shader_preset", { presetName: name });
      // In a real scenario, this would apply the shader to the emulator launch config
    } catch (err) {
      console.error("Failed to apply preset", err);
    }
  };

  return (
    <div className="shader-selector">
      <h3>Visual Style (Shaders)</h3>
      <div className="preset-grid">
        {presets.map((p) => (
          <button 
            key={p.name} 
            className={`preset-btn ${activePreset === p.name ? 'active' : ''}`}
            onClick={() => selectPreset(p.name)}
          >
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="shader-hint">Change the look of your games (CRT, Scanlines, etc.)</p>
    </div>
  );
}
