import { useState } from "react";
import { t } from "../i18n";
import AuditPanel from "./AuditPanel";
import ShaderSelector from "./ShaderSelector";
import "./OperatorPanel.css";

interface OperatorPanelProps {
  onBack: () => void;
}

export default function OperatorPanel({ onBack }: OperatorPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "visual" | "audit">("general");

  return (
    <div className="operator-panel-overlay">
      <div className="operator-panel">
        <div className="operator-sidebar">
          <h2>NEOCAB OPS</h2>
          <button 
            className={activeTab === "general" ? "active" : ""} 
            onClick={() => setActiveTab("general")}
          >
            {t('GENERAL_SETTINGS')}
          </button>
          <button 
            className={activeTab === "visual" ? "active" : ""} 
            onClick={() => setActiveTab("visual")}
          >
            {t('VISUAL_STYLES')}
          </button>
          <button 
            className={activeTab === "audit" ? "active" : ""} 
            onClick={() => setActiveTab("audit")}
          >
            {t('LIBRARY_AUDIT')}
          </button>
          <div className="sidebar-footer">
            <button className="back-btn" onClick={onBack}>{t('BACK')}</button>
          </div>
        </div>

        <div className="operator-content">
          {activeTab === "general" && (
            <div className="settings-group">
              <h3>Cabinet Information</h3>
              <p>System Status: ONLINE</p>
              <p>Version: NeoCab Elite v1.0</p>
              <p>Platform: Windows Arcade Core</p>
            </div>
          )}
          {activeTab === "visual" && <ShaderSelector />}
          {activeTab === "audit" && <AuditPanel />}
        </div>
      </div>
    </div>
  );
}
