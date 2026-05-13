import React, { useState, useEffect } from 'react';
import { HyperSpinWheel } from '../wheel';
import { GameListPanel } from '../game-list';
import { useArcade } from '../../context/ArcadeContext';
import { FadeOverlay } from '../launcher/FadeOverlay';
import { useLaunchOverlay } from '../../hooks/useLaunchOverlay';
import './GameScreen.css';

interface GameScreenProps {
  onBack?: () => void;
}

/**
 * Main game selection and launch screen
 * Combines system selection (wheel) with game list and backend integration
 */
export const GameScreen: React.FC<GameScreenProps> = ({ onBack }) => {
  const {
    systems,
    games,
    selectedSystem,
    selectedGame,
    loading,
    error,
    selectSystem,
    selectGame,
    launchGame,
  } = useArcade();

  const [systemIndex, setSystemIndex] = useState(0);
  const [gameIndex, setGameIndex] = useState(0);
  const [showError, setShowError] = useState(false);
  const {
    isVisible: showLaunchOverlay,
    gameName: launchGameName,
    showLaunchOverlay: activateLaunchOverlay,
    completeLaunch,
  } = useLaunchOverlay();

  // Convert systems to wheel items
  const wheelItems = systems.map((sys) => ({
    id: sys.id,
    name: sys.name,
    icon: sys.icon,
    color: sys.color,
  }));

  // Handle system selection from wheel
  const handleSelectSystem = async (index: number) => {
    setSystemIndex(index);
    if (systems[index]) {
      await selectSystem(systems[index]);
      setGameIndex(0); // Reset game index when changing system
    }
  };

  // Handle game selection from list
  const handleSelectGame = (index: number) => {
    setGameIndex(index);
    if (games[index]) {
      selectGame(games[index]);
    }
  };

  // Handle game launch
  const handleLaunchGame = async () => {
    try {
      setShowError(false);
      if (selectedGame) {
        activateLaunchOverlay(selectedGame.name);
        await launchGame();
        completeLaunch();
      }
    } catch (err) {
      setShowError(true);
      console.error('Error launching game:', err);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onBack]);

  return (
    <div className="game-screen">
      {showLaunchOverlay && (
        <FadeOverlay
          isVisible={showLaunchOverlay}
          gameName={launchGameName}
          duration={3000}
          onFadeComplete={completeLaunch}
        />
      )}

      {error && showError && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={() => setShowError(false)}>✕</button>
        </div>
      )}

      <div className="game-screen-content">
        <div className="screen-header">
          <h1 className="screen-title">GAME SELECTION</h1>
          {selectedSystem && (
            <div className="breadcrumb">
              <span className="breadcrumb-item">{selectedSystem.name}</span>
              {selectedGame && (
                <>
                  <span className="breadcrumb-separator">›</span>
                  <span className="breadcrumb-item">{selectedGame.name}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="screen-main">
          <div className="wheel-section">
            <h2 className="section-label">SYSTEMS</h2>
            {wheelItems.length > 0 ? (
              <HyperSpinWheel
                items={wheelItems}
                selectedIndex={systemIndex}
                onSelect={handleSelectSystem}
                onConfirm={(item) => {
                  const sys = systems.find((s) => s.id === item.id);
                  if (sys) selectSystem(sys);
                }}
                radius={120}
                itemSize={38}
                rotationSpeed={300}
                showLabels={true}
                animated={true}
              />
            ) : (
              <div className="no-systems">
                <p>No systems available</p>
                <button className="scan-button" disabled={loading}>
                  {loading ? 'Scanning...' : 'Scan ROMs'}
                </button>
              </div>
            )}
          </div>

          <div className="list-section">
            <h2 className="section-label">GAMES</h2>
            {selectedSystem ? (
              <GameListPanel
                games={games}
                selectedIndex={gameIndex}
                onSelect={handleSelectGame}
                onConfirm={() => handleLaunchGame()}
                systemName={selectedSystem.name}
                showDescription={true}
                scrollBehavior="smooth"
              />
            ) : (
              <div className="no-games">
                <p>Select a system to view games</p>
              </div>
            )}
          </div>
        </div>

        <div className="screen-footer">
          <div className="footer-status">
            {loading ? (
              <span className="status-loading">Loading...</span>
            ) : selectedGame ? (
              <span className="status-ready">Ready to launch</span>
            ) : (
              <span className="status-idle">Select a game</span>
            )}
          </div>

          <div className="footer-controls">
            <button
              className="footer-button launch-button"
              onClick={handleLaunchGame}
              disabled={!selectedGame || loading}
            >
              ▶ LAUNCH GAME
            </button>
            <button
              className="footer-button back-button"
              onClick={handleBack}
              disabled={loading}
            >
              ← BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
