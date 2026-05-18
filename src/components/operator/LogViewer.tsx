import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './LogViewer.css';

interface LogFile {
  filename: string;
  size: number;
  modified_timestamp: number;
}

export const LogViewer: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [tailContent, setTailContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewMode, setViewMode] = useState<'tail' | 'full'>('tail');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(
    null
  );

  const loadLogFiles = useCallback(async () => {
    try {
      setError(null);
      const resultStr = await invoke<string>('list_log_files');
      const result = JSON.parse(resultStr);

      if (result.success) {
        setLogFiles(result.files);
        if (result.files.length > 0 && !selectedFile) {
          setSelectedFile(result.files[0].filename);
        }
      } else {
        setError('Failed to load log files');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load log files: ${message}`);
    }
  }, [selectedFile]);

  const loadLogContent = useCallback(async (filename?: string | null) => {
    const file = filename || selectedFile;
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      if (viewMode === 'tail') {
        const content = await invoke<string>('get_log_tail', {
          lines: 100,
          filename: file,
        });
        setTailContent(content);
      } else {
        const content = await invoke<string>('read_log_file', {
          filename: file,
        });
        setLogContent(content);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load log content: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedFile]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all log files?')) {
      return;
    }

    try {
      setError(null);
      const resultStr = await invoke<string>('clear_logs');
      const result = JSON.parse(resultStr);

      if (result.success) {
        setLogContent('');
        setTailContent('');
        await loadLogFiles();
      } else {
        setError(result.errors?.join(', ') || 'Failed to clear logs');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to clear logs: ${message}`);
    }
  };

  const handleRefresh = () => {
    loadLogContent();
  };

  const handleViewModeChange = (mode: 'tail' | 'full') => {
    setViewMode(mode);
    loadLogContent();
  };

  useEffect(() => {
    loadLogFiles();
  }, [loadLogFiles]);

  useEffect(() => {
    if (selectedFile) {
      loadLogContent(selectedFile);
    }
  }, [selectedFile, loadLogContent]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logContent, tailContent, autoScroll]);

  // Auto-refresh every 2 seconds when in tail mode
  useEffect(() => {
    if (viewMode === 'tail' && !refreshInterval) {
      const interval = setInterval(() => {
        loadLogContent();
      }, 2000);
      setRefreshInterval(interval);
    } else if (viewMode !== 'tail' && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [viewMode, refreshInterval, loadLogContent]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const currentContent =
    viewMode === 'tail' ? tailContent : logContent;

  return (
    <div className="log-viewer">
      <div className="log-header">
        <h3 className="log-title">System Logs</h3>
        <div className="log-controls">
          <button
            className="log-button refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="log-button clear-button"
            onClick={handleClearLogs}
            disabled={loading || logFiles.length === 0}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="log-files-section">
        <div className="files-header">
          <span className="files-label">Log Files ({logFiles.length})</span>
        </div>

        <div className="log-files-list">
          {logFiles.length === 0 ? (
            <div className="no-logs">No log files found</div>
          ) : (
            logFiles.map((file) => (
              <div
                key={file.filename}
                className={`log-file-item ${
                  selectedFile === file.filename ? 'active' : ''
                }`}
                onClick={() => setSelectedFile(file.filename)}
              >
                <div className="file-name">{file.filename}</div>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="file-date">
                    {formatTimestamp(file.modified_timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="log-viewer-section">
        <div className="viewer-header">
          <div className="view-mode-toggle">
            <button
              className={`view-button ${viewMode === 'tail' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('tail')}
            >
              Tail (Last 100 Lines)
            </button>
            <button
              className={`view-button ${viewMode === 'full' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('full')}
            >
              Full Log
            </button>
          </div>

          <div className="viewer-options">
            <label className="auto-scroll-toggle">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span>Auto Scroll</span>
            </label>
          </div>
        </div>

        {error && <div className="log-error">{error}</div>}

        <div
          className="log-container"
          ref={logContainerRef}
          onScroll={() => {
            if (logContainerRef.current) {
              const isAtBottom =
                logContainerRef.current.scrollHeight -
                  logContainerRef.current.scrollTop -
                  logContainerRef.current.clientHeight <
                100;
              setAutoScroll(isAtBottom);
            }
          }}
        >
          {loading && <div className="log-loading">Loading...</div>}
          {!loading && !currentContent && (
            <div className="log-empty">No log content</div>
          )}
          {!loading && currentContent && (
            <pre className="log-content">{currentContent}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
