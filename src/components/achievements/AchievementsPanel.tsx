import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from '../../i18n';
import { toast } from '../../stores/useNotificationStore';
import './AchievementsPanel.css';

interface UserSummary {
  username: string;
  points: number;
  total_achievements: number;
  games_completed: number;
  Rank: string;
}

export function AchievementsPanel() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ configured: boolean; username: string } | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !apiKey.trim()) {
      setError('Username and API key are required');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const result = await invoke<{ configured: boolean; username: string }>('ra_login', {
        username: username.trim(),
        apiKey: apiKey.trim(),
      });
      setAuthStatus(result);
      toast.success('Logged in', `Connected as ${result.username}`);
      loadUserSummary(username.trim(), apiKey.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error('Login failed', msg);
    } finally {
      setIsLoggingIn(false);
    }
  }, [username, apiKey]);

  const loadUserSummary = async (user: string, key: string) => {
    try {
      const summary = await invoke<UserSummary>('ra_get_user_summary', { username: user, apiKey: key });
      setUserSummary(summary);
    } catch (e) {
      console.error('Failed to load user summary:', e);
    }
  };

  const handleLogout = useCallback(() => {
    setAuthStatus(null);
    setUserSummary(null);
    setUsername('');
    setApiKey('');
    toast.success('Logged out', 'RetroAchievements disconnected');
  }, []);

  if (!authStatus?.configured) {
    return (
      <div className="achievements-panel">
        <div className="panel-header">
          <h3>{t('achievements.title') || 'RetroAchievements'}</h3>
        </div>
        <p className="panel-description">
          {t('achievements.description') || 'Connect your RetroAchievements account to track achievements while playing.'}
        </p>
        <div className="login-form">
          <div className="form-group">
            <label htmlFor="ra-username">{t('achievements.username') || 'Username'}</label>
            <input
              id="ra-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('achievements.username_placeholder') || 'Enter your username'}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ra-apikey">{t('achievements.api_key') || 'API Key'}</label>
            <input
              id="ra-apikey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('achievements.api_key_placeholder') || 'Enter your API key'}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={isLoggingIn || !username.trim() || !apiKey.trim()}
          >
            {isLoggingIn ? '...' : t('achievements.login') || 'Login'}
          </button>
          <p className="help-text">
            {t('achievements.help') || 'Get your API key from'} {' '}
            <a href="https://retroachievements.org/controlpanel.php" target="_blank" rel="noreferrer noopener">
              retroachievements.org
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-panel">
      <div className="panel-header">
        <h3>{t('achievements.title') || 'RetroAchievements'}</h3>
        <button className="logout-btn" onClick={handleLogout}>
          {t('achievements.logout') || 'Logout'}
        </button>
      </div>
      <div className="user-info">
        <div className="user-header">
          <span className="user-name">{authStatus.username}</span>
          <span className="user-rank">{userSummary?.Rank || 'Unknown'}</span>
        </div>
        <div className="user-stats">
          <div className="stat">
            <span className="stat-value">{userSummary?.points || 0}</span>
            <span className="stat-label">{t('achievements.points') || 'Points'}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{userSummary?.total_achievements || 0}</span>
            <span className="stat-label">{t('achievements.achievements') || 'Achievements'}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{userSummary?.games_completed || 0}</span>
            <span className="stat-label">{t('achievements.games_completed') || 'Games'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}