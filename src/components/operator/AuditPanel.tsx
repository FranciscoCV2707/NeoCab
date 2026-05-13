import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './AuditPanel.css';

interface MissingRomEntry {
  game_id: string;
  game_name: string;
  system: string;
  rom_file: string;
  expected_path: string;
}

interface MissingMediaEntry {
  game_id: string;
  game_name: string;
  system: string;
  media_type: string;
  expected_path: string;
}

interface AuditResult {
  system: string;
  total_games: number;
  missing_roms: number;
  missing_media: number;
  missing_rom_entries: MissingRomEntry[];
  missing_media_entries: MissingMediaEntry[];
}

type AuditMode = 'roms' | 'media' | 'full';

export const AuditPanel: React.FC = () => {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditMode, setAuditMode] = useState<AuditMode>('full');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(
    new Set()
  );

  const runAudit = async () => {
    try {
      setLoading(true);
      setError(null);

      const commandName =
        auditMode === 'roms'
          ? 'audit_roms'
          : auditMode === 'media'
          ? 'audit_media'
          : 'audit_full';

      const resultStr = await invoke<string>(commandName, {
        system: selectedSystem,
      });
      const result = JSON.parse(resultStr);

      if (result.success) {
        setResults(result.results || []);
      } else {
        setError('Failed to run audit');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to run audit: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystemExpanded = (system: string) => {
    const newSet = new Set(expandedSystems);
    if (newSet.has(system)) {
      newSet.delete(system);
    } else {
      newSet.add(system);
    }
    setExpandedSystems(newSet);
  };

  const getTotalIssues = (): { roms: number; media: number } => {
    return {
      roms: results.reduce((sum, r) => sum + r.missing_roms, 0),
      media: results.reduce((sum, r) => sum + r.missing_media, 0),
    };
  };

  const totals = getTotalIssues();

  return (
    <div className="audit-panel">
      <div className="audit-header">
        <h3 className="audit-title">Auditoría de Archivos</h3>
        <div className="audit-summary">
          {auditMode === 'roms' || auditMode === 'full' ? (
            <span className="summary-item">
              ROMs Faltantes: <strong>{totals.roms}</strong>
            </span>
          ) : null}
          {auditMode === 'media' || auditMode === 'full' ? (
            <span className="summary-item">
              Media Faltante: <strong>{totals.media}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="audit-controls">
        <div className="mode-selector">
          <label className="control-label">Tipo de Auditoría:</label>
          <div className="mode-buttons">
            <button
              className={`mode-button ${auditMode === 'roms' ? 'active' : ''}`}
              onClick={() => setAuditMode('roms')}
            >
              ROMs
            </button>
            <button
              className={`mode-button ${auditMode === 'media' ? 'active' : ''}`}
              onClick={() => setAuditMode('media')}
            >
              Media
            </button>
            <button
              className={`mode-button ${auditMode === 'full' ? 'active' : ''}`}
              onClick={() => setAuditMode('full')}
            >
              Completa
            </button>
          </div>
        </div>

        <div className="system-selector">
          <label className="control-label">Sistema:</label>
          <select
            className="system-select"
            value={selectedSystem || ''}
            onChange={(e) => setSelectedSystem(e.target.value || null)}
          >
            <option value="">Todos</option>
            {results.map((r) => (
              <option key={r.system} value={r.system}>
                {r.system}
              </option>
            ))}
          </select>
        </div>

        <button
          className="audit-button"
          onClick={runAudit}
          disabled={loading}
        >
          {loading ? '🔍 Analizando...' : '🔍 Ejecutar Auditoría'}
        </button>
      </div>

      {error && <div className="audit-error">{error}</div>}

      <div className="audit-results">
        {results.length === 0 && !loading && (
          <div className="audit-empty">
            Ejecuta una auditoría para ver los resultados
          </div>
        )}

        {results.map((result) => (
          <div key={result.system} className="audit-system">
            <div
              className="system-header"
              onClick={() => toggleSystemExpanded(result.system)}
            >
              <span className="expand-icon">
                {expandedSystems.has(result.system) ? '▼' : '▶'}
              </span>
              <span className="system-name">{result.system}</span>
              <span className="system-stats">
                {result.total_games} juegos
                {(result.missing_roms > 0 || result.missing_media > 0) && (
                  <span className="issue-count">
                    {result.missing_roms > 0 && (
                      <span className="rom-count">
                        {result.missing_roms} ROMs
                      </span>
                    )}
                    {result.missing_media > 0 && (
                      <span className="media-count">
                        {result.missing_media} Media
                      </span>
                    )}
                  </span>
                )}
              </span>
            </div>

            {expandedSystems.has(result.system) && (
              <div className="system-details">
                {(auditMode === 'roms' || auditMode === 'full') &&
                  result.missing_rom_entries.length > 0 && (
                    <div className="issues-section">
                      <h4 className="section-title">ROMs Faltantes</h4>
                      <div className="entries-list">
                        {result.missing_rom_entries
                          .slice(0, 5)
                          .map((entry) => (
                            <div
                              key={`${entry.game_id}-rom`}
                              className="entry-item"
                            >
                              <div className="entry-game">{entry.game_name}</div>
                              <div className="entry-path">
                                {entry.expected_path}
                              </div>
                            </div>
                          ))}
                        {result.missing_rom_entries.length > 5 && (
                          <div className="entries-more">
                            +{result.missing_rom_entries.length - 5} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {(auditMode === 'media' || auditMode === 'full') &&
                  result.missing_media_entries.length > 0 && (
                    <div className="issues-section">
                      <h4 className="section-title">Media Faltante</h4>
                      <div className="entries-list">
                        {result.missing_media_entries
                          .slice(0, 5)
                          .map((entry, idx) => (
                            <div
                              key={`${entry.game_id}-${entry.media_type}-${idx}`}
                              className="entry-item"
                            >
                              <div className="entry-game">
                                {entry.game_name}{' '}
                                <span className="media-type">
                                  ({entry.media_type})
                                </span>
                              </div>
                              <div className="entry-path">
                                {entry.expected_path}
                              </div>
                            </div>
                          ))}
                        {result.missing_media_entries.length > 5 && (
                          <div className="entries-more">
                            +{result.missing_media_entries.length - 5} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {result.missing_roms === 0 &&
                  result.missing_media === 0 && (
                    <div className="audit-ok">✓ Todos los archivos presentes</div>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="audit-info">
        <p>
          La auditoría compara los juegos en la base de datos con los archivos
          en disco.
        </p>
        <p className="info-small">
          Verifica ROMs en las rutas configuradas y media en{' '}
          <code>./data/media/</code>
        </p>
      </div>
    </div>
  );
};

export default AuditPanel;
