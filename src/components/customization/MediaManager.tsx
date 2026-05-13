import React, { useState } from 'react';
import { useMedia } from '../../hooks/useMedia';
import './MediaManager.css';

interface MediaManagerProps {
  onClose?: () => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ onClose }) => {
  const { stats, isLoading, error, getStats, organizeMedia, importMedia } = useMedia();
  const [activeTab, setActiveTab] = useState<'stats' | 'import' | 'organize'>('stats');
  const [sourcePath, setSourcePath] = useState('');
  const [organizing, setOrganizing] = useState(false);
  const [organizeMessage, setOrganizeMessage] = useState('');

  const handleOrganizeMedia = async () => {
    if (!sourcePath.trim()) {
      setOrganizeMessage('Please enter a source directory');
      return;
    }

    setOrganizing(true);
    setOrganizeMessage('');

    try {
      const count = await organizeMedia(sourcePath);
      setOrganizeMessage(`✓ Successfully organized ${count} media files`);
      setSourcePath('');
      await getStats();
    } catch (err) {
      setOrganizeMessage(`✗ Failed to organize media: ${err}`);
    } finally {
      setOrganizing(false);
    }
  };

  const handleImportMedia = async () => {
    if (!sourcePath.trim()) {
      setOrganizeMessage('Please enter a source path');
      return;
    }

    setOrganizing(true);
    setOrganizeMessage('');

    try {
      const count = await importMedia(sourcePath);
      setOrganizeMessage(`✓ Successfully imported ${count} media files`);
      setSourcePath('');
      await getStats();
    } catch (err) {
      setOrganizeMessage(`✗ Failed to import media: ${err}`);
    } finally {
      setOrganizing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="media-manager">
      <div className="media-header">
        <h2>Media Manager</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      <div className="media-tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`tab ${activeTab === 'organize' ? 'active' : ''}`}
          onClick={() => setActiveTab('organize')}
        >
          Organize
        </button>
        <button
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Import
        </button>
      </div>

      <div className="media-content">
        {activeTab === 'stats' && (
          <div className="stats-tab">
            {isLoading ? (
              <div className="loading">Loading media statistics...</div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Files</h3>
                  <p className="stat-value">{stats.total_files}</p>
                </div>

                <div className="stat-card">
                  <h3>Total Size</h3>
                  <p className="stat-value">{formatBytes(stats.total_size)}</p>
                </div>

                <div className="stat-card">
                  <h3>Wheels</h3>
                  <p className="stat-value">{stats.wheels_count}</p>
                </div>

                <div className="stat-card">
                  <h3>Box Art</h3>
                  <p className="stat-value">{stats.box_art_count}</p>
                </div>

                <div className="stat-card">
                  <h3>Backgrounds</h3>
                  <p className="stat-value">{stats.backgrounds_count}</p>
                </div>

                <div className="stat-card">
                  <h3>Screenshots</h3>
                  <p className="stat-value">{stats.screenshots_count}</p>
                </div>
              </div>
            ) : (
              <div className="no-data">No media statistics available</div>
            )}

            <button className="btn-refresh" onClick={getStats} disabled={isLoading}>
              {isLoading ? 'Scanning...' : 'Refresh Statistics'}
            </button>
          </div>
        )}

        {activeTab === 'organize' && (
          <div className="organize-tab">
            <div className="info-box">
              <h3>Organize Media</h3>
              <p>
                Automatically organize media files from a source directory into HyperSpin structure.
              </p>
              <p className="hint">Naming convention: {'{system}_{game}.{ext}'}</p>
            </div>

            <div className="input-section">
              <label>Source Directory Path</label>
              <input
                type="text"
                placeholder="e.g., C:\Media or /home/user/media"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                disabled={organizing}
              />
              <button
                className="btn-organize"
                onClick={handleOrganizeMedia}
                disabled={organizing || isLoading}
              >
                {organizing ? 'Organizing...' : 'Organize Media'}
              </button>
            </div>

            {organizeMessage && (
              <div className={`message ${organizeMessage.startsWith('✓') ? 'success' : 'error'}`}>
                {organizeMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-tab">
            <div className="info-box">
              <h3>Import Media</h3>
              <p>Import media files from a directory or archive file.</p>
              <p className="hint">Supports PNG, JPG, GIF, WebP formats</p>
            </div>

            <div className="input-section">
              <label>Source Path</label>
              <input
                type="text"
                placeholder="e.g., C:\Downloads\Media.zip or /home/user/media"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                disabled={organizing}
              />
              <button
                className="btn-import"
                onClick={handleImportMedia}
                disabled={organizing || isLoading}
              >
                {organizing ? 'Importing...' : 'Import Media'}
              </button>
            </div>

            {organizeMessage && (
              <div className={`message ${organizeMessage.startsWith('✓') ? 'success' : 'error'}`}>
                {organizeMessage}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="media-footer">
        <p className="footer-text">
          Media stored in: ./data/media/{'{system}/Images/{Wheels,Boxes,Backgrounds}'}
        </p>
      </div>
    </div>
  );
};

export default MediaManager;
