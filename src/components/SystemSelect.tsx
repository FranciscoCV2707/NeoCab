interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

interface SystemSelectProps {
  systems: System[];
  onSelectSystem: (system: System) => void;
  onBack: () => void;
  loading: boolean;
}

export default function SystemSelect({
  systems,
  onSelectSystem,
  onBack,
  loading,
}: SystemSelectProps) {
  return (
    <div className="system-select-container">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Select System</h2>
      </div>

      <div className="systems-grid">
        {systems.map((system) => (
          <button
            key={system.id}
            className="system-button"
            onClick={() => onSelectSystem(system)}
            disabled={loading}
          >
            <div className="system-icon">{system.display_name[0]}</div>
            <div className="system-name">{system.display_name}</div>
            <div className="system-meta">{system.extensions}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
