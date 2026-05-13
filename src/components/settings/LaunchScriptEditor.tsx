import React, { useState } from 'react';
import './LaunchScriptEditor.css';

interface LaunchScriptEditorProps {
  systemName: string;
  preScript?: string;
  postScript?: string;
  onSave?: (preScript: string, postScript: string) => void;
  onCancel?: () => void;
}

export const LaunchScriptEditor: React.FC<LaunchScriptEditorProps> = ({
  systemName,
  preScript = '',
  postScript = '',
  onSave,
  onCancel,
}) => {
  const [pre, setPre] = useState(preScript);
  const [post, setPost] = useState(postScript);
  const [showHelp, setShowHelp] = useState(false);

  // Detect OS based on user agent (since process is not available in browser)
  const isWindows = /windows|win32/i.test(navigator.userAgent);

  const handleSave = () => {
    if (onSave) {
      onSave(pre, post);
    }
  };

  return (
    <div className="launch-script-editor">
      <div className="editor-header">
        <h3>Launch Scripts - {systemName}</h3>
        <button
          className="help-button"
          onClick={() => setShowHelp(!showHelp)}
          title="Show help"
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div className="editor-help">
          <h4>Script Guide</h4>
          <ul>
            <li>
              <strong>Pre-Launch:</strong> Runs before game starts (e.g., mount drives, set display mode)
            </li>
            <li>
              <strong>Post-Launch:</strong> Runs after game exits in background (e.g., cleanup, reset)
            </li>
            <li>
              <strong>Environment:</strong> {isWindows ? 'Windows CMD' : 'Bash'} syntax
            </li>
            <li>
              <strong>ROM_PATH:</strong> Available as environment variable (ROM path)
            </li>
            <li>
              <strong>Example (Windows):</strong> <code>dir %ROM_PATH%</code>
            </li>
            <li>
              <strong>Example (Linux):</strong> <code>ls "$ROM_PATH"</code>
            </li>
          </ul>
        </div>
      )}

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="pre-script">Pre-Launch Script</label>
          <textarea
            id="pre-script"
            className="script-textarea"
            value={pre}
            onChange={(e) => setPre(e.target.value)}
            placeholder={
              isWindows
                ? 'e.g., echo Launching %ROM_PATH%'
                : 'e.g., echo Launching $ROM_PATH'
            }
            rows={6}
          />
          <small>Executes before game launch</small>
        </div>

        <div className="form-group">
          <label htmlFor="post-script">Post-Launch Script</label>
          <textarea
            id="post-script"
            className="script-textarea"
            value={post}
            onChange={(e) => setPost(e.target.value)}
            placeholder={
              isWindows
                ? 'e.g., rmdir /s /q "%ROM_PATH%\\temp"'
                : 'e.g., rm -rf "$ROM_PATH/temp"'
            }
            rows={6}
          />
          <small>Executes after game exit (background)</small>
        </div>
      </div>

      <div className="editor-footer">
        <button
          className="editor-button save-button"
          onClick={handleSave}
          disabled={!pre && !post}
        >
          💾 Save Scripts
        </button>
        <button
          className="editor-button cancel-button"
          onClick={onCancel}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
};

export default LaunchScriptEditor;
