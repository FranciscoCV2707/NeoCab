import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { useUnifiedInput } from "./hooks/useUnifiedInputHook";
import { InputAction } from "./hooks/useUnifiedInput";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { useAudio } from "./hooks/useAudio";
import { useTheme } from "./hooks/useTheme";
import { FadeOverlay } from "./components/launcher/FadeOverlay";
import { PauseMenu } from "./components/launcher/PauseMenu";
import { ViewTransition } from "./components/ViewTransition";
import GameList from "./components/GameList";
import SystemSelect from "./components/SystemSelect";
import MainMenu from "./components/MainMenu";
import AttractMode from "./components/AttractMode";
import SaveStateModal, { SaveState } from "./components/SaveStateModal";
import { OperatorPanel } from "./components/operator/OperatorPanel";
import "./App.css";

export interface Game {
  id: number;
  title: string;
  system_id: number;
  rom_path: string;
  filename?: string;
  crc32?: string;
  is_favorite: number;
  video_path?: string;
  image_path?: string;
  wheel_path?: string;
  marquee_path?: string;
  description?: string;
  developer?: string;
  publisher?: string;
  year?: number;
  players?: number;
  genre?: string;
  play_count?: number;
  total_play_time?: number;
  last_played?: string;
  rating?: number;
}

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

interface ScanProgressPayload {
  current: number;
  total: number;
  filename: string;
}

type View = "menu" | "systems" | "games" | "operator";

export default function App() {
  const { currentTheme, applyTheme, listThemes } = useTheme();
  const [currentView, setCurrentView] = useState<View>("menu");
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [fadeVisible, setFadeVisible] = useState(false);
  const [pauseVisible, setPauseVisible] = useState(false);
  const [fadeInfo, setFadeInfo] = useState({ game: "", system: "" });
  const [fadeConfig] = useState<any>(null);
  const { playSound, playBGM, stopBGM } = useAudio();

  useEffect(() => {
    // Listen for pause toggle
    const unlistenPause = listen("toggle_pause_menu", () => {
      setPauseVisible(prev => !prev);
    });

    // Listen for game launch events
    const unlistenStart = listen("game_launch_start", (event: any) => {
      setFadeInfo({ game: event.payload.game, system: event.payload.system });
      setFadeVisible(true);
      setPauseVisible(false);
    });

    const unlistenReady = listen("game_launch_ready", () => {
      setTimeout(() => setFadeVisible(false), 1000);
    });

    return () => {
      unlistenPause.then(f => f());
      unlistenStart.then(f => f());
      unlistenReady.then(f => f());
    };
  }, []);

  // Try playing BGM on initial load, but might need user interaction first
  useEffect(() => {
    // Only play BGM on the menu/system screens, stop during gameplay
    if (currentView !== "games") {
      playBGM();
    }
  }, [currentView, playBGM]);

  useEffect(() => {
    loadSystems();

    // Listen for real-time scan progress
    const unlisten = listen<ScanProgressPayload>("scan_progress", (event) => {
      const { current, total, filename } = event.payload;
      const percentage = Math.round((current / total) * 100);
      setScanProgress(`Scanning: ${percentage}% - ${filename}`);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (!currentTheme) return;
    const root = document.documentElement;
    const body = document.body;

    // Apply CSS variables from theme colors
    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
    }

    // Apply font variables
    if (currentTheme.fonts) {
      Object.entries(currentTheme.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value as string);
      });
    }

    // Apply layout variables
    if (currentTheme.layout) {
      root.style.setProperty('--animation-speed', `${currentTheme.layout.animation_speed}ms`);
      root.style.setProperty('--transition-easing', currentTheme.layout.easing);
    }

    // Apply effects
    if (currentTheme.effects) {
      root.style.setProperty('--glow-intensity', String(currentTheme.effects.glow_intensity));
      root.style.setProperty('--scanlines', currentTheme.effects.scanlines ? '1' : '0');
      root.style.setProperty('--crt-curve', String(currentTheme.effects.crt_curve));

      // Apply scanlines overlay if enabled
      if (currentTheme.effects.scanlines) {
        if (!document.getElementById('scanlines-overlay')) {
          const overlay = document.createElement('div');
          overlay.id = 'scanlines-overlay';
          overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9999;
            background: repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15),
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 2px
            );
          `;
          body.appendChild(overlay);
        }
      } else {
        const overlay = document.getElementById('scanlines-overlay');
        if (overlay) overlay.remove();
      }
    }

    // Apply theme class to body for theme-specific CSS
    body.className = `theme-${(currentTheme.name || 'default').toLowerCase().replace(/\s+/g, '-')}`;
  }, [currentTheme]);

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAttractMode, setIsAttractMode] = useState(false);
  
  // Save State Modal
  const [showSaveStateModal, setShowSaveStateModal] = useState(false);
  const [pendingGame, setPendingGame] = useState<Game | null>(null);
  const [saveStatesList, setSaveStatesList] = useState<SaveState[]>([]);

  const attractTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAttractTimer = useCallback(() => {
    if (attractTimer.current) clearTimeout(attractTimer.current);
    if (isAttractMode) setIsAttractMode(false);
    
    attractTimer.current = setTimeout(() => {
      if (currentView === "games" && games.length > 0) {
        setIsAttractMode(true);
      }
    }, 60000); // 1 minute of inactivity
  }, [currentView, games.length, isAttractMode]);

  useEffect(() => {
    const handleActivity = () => resetAttractTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    resetAttractTimer();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      if (attractTimer.current) clearTimeout(attractTimer.current);
    };
  }, [resetAttractTimer]);

  // Interval logic moved to AttractMode component

  const loadSystems = async () => {
    setLoading(true);
    try {
      const dbSystems = await invoke<System[]>("list_systems");
      
      const virtualSystems: System[] = [
        { id: 9991, name: "virtual-all", display_name: "All Games", extensions: "" },
        { id: 9992, name: "virtual-favorites", display_name: "Favorites", extensions: "" },
        { id: 9993, name: "virtual-recent", display_name: "Recently Played", extensions: "" }
      ];
      
      setSystems([...virtualSystems, ...dbSystems]);
    } catch (error) {
      console.error("Failed to load systems:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async (systemName: string, search?: string) => {
    setLoading(true);
    try {
      const dbGames = await invoke<Game[]>("list_games", { 
        system: systemName,
        search: search || undefined
      });
      
      // Enrich with media
      const enrichedGames = await Promise.all(dbGames.map(async (game) => {
        try {
          const gameName = (game.filename || game.title || "").replace(/\.[^/.]+$/, "");
          const mediaResult = await invoke<string>("get_all_game_media", {
            system: systemName,
            gameName
          });
          const media = JSON.parse(mediaResult).media;
          return {
            ...game,
            image_path: media.box_art || media.screenshot || game.image_path,
            video_path: media.video || game.video_path,
            wheel_path: media.wheel || game.wheel_path,
            marquee_path: media.marquee || game.marquee_path
          };
        } catch (e) {
          return game;
        }
      }));

      setGames(enrichedGames);
      setFocusedIndex(0);
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanROMs = async () => {
    setLoading(true);
    setScanProgress("Scanning ROMs...");
    try {
      const result = await invoke<string>("scan_roms", {
        romsDir: "./roms",
      });
      const parsed = JSON.parse(result);
      setScanProgress(
        `Found ${parsed.games_found} new games!`
      );
      setTimeout(() => {
        loadSystems();
        setScanProgress("");
      }, 2000);
    } catch (error) {
      setScanProgress(`Scan failed: ${error}`);
      console.error("ROM scan failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSystem = async (system: System) => {
    playSound('select');
    setSelectedSystem(system);
    setCurrentView("games");
    await loadGames(system.name);
  };

  const handlePlayGame = async (game: Game) => {
    playSound('select');
    try {
      const states = await invoke<SaveState[]>("get_save_states", { gameId: game.id });
      if (states && states.length > 0) {
        setSaveStatesList(states);
        setPendingGame(game);
        setShowSaveStateModal(true);
      } else {
        executeLaunch(game, null);
      }
    } catch (e) {
      // If error, just launch normally
      executeLaunch(game, null);
    }
  };

  const executeLaunch = async (game: Game, saveState: SaveState | null) => {
    setShowSaveStateModal(false);
    playSound('start');
    stopBGM(); // Stop music when playing
    
    try {
      const emulator = selectedSystem?.name || "mame";
      const startTime = Date.now();
      
      // We pass the save state slot if selected, assuming backend supports it (optional)
      await invoke("launch_game", {
        gameId: game.id.toString(),
        emulator: emulator,
        // stateSlot: saveState ? saveState.slot : null
      });

      // Simple pseudo-tracking for now
      setTimeout(async () => {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000) + 60; // Mock 60 seconds
        await invoke("update_play_stats", { gameId: game.id, playTimeSeconds: durationSeconds });
        playBGM(); // Resume BGM when returned
      }, 5000);
      
    } catch (error) {
      playSound('error');
      console.error("Failed to launch game:", error);
      playBGM();
    }
  };

  const handleBack = () => {
    playSound('back');
    if (currentView === "games") {
      setCurrentView("systems");
      setFocusedIndex(0);
    } else if (currentView === "systems") {
      setCurrentView("menu");
      setFocusedIndex(0);
    }
  };

  const handleUnifiedAction = useCallback((action: InputAction) => {
    resetAttractTimer();

    if (['up', 'down', 'left', 'right'].includes(action)) {
      playSound('navigate');
    }

    if (currentView === "menu") {
      if (action === 'confirm') {
        playSound('select');
        setCurrentView("systems");
      }
    } else if (currentView === "systems") {
      if (action === 'up' || action === 'left') setFocusedIndex(prev => Math.max(0, prev - 1));
      if (action === 'down' || action === 'right') setFocusedIndex(prev => Math.min(systems.length - 1, prev + 1));
      if (action === 'confirm') handleSelectSystem(systems[focusedIndex]);
      if (action === 'back') handleBack();
    } else if (currentView === "games") {
      if (action === 'up') setFocusedIndex(prev => Math.max(0, prev - 1));
      if (action === 'down') setFocusedIndex(prev => Math.min(games.length - 1, prev + 1));
      if (action === 'confirm') handlePlayGame(games[focusedIndex]);
      if (action === 'back') handleBack();
      if (action === 'coin') {
        invoke('session_insert_coin').catch(() => {});
      }
    } else if (currentView === "operator") {
      if (action === 'back') {
        setCurrentView("menu");
      }
    }
  }, [currentView, focusedIndex, systems, games, handleSelectSystem, handlePlayGame, handleBack, playSound]);

  useUnifiedInput({ onAction: handleUnifiedAction });

  useEffect(() => {
    if (currentView === "games" && games[focusedIndex]) {
      const game = games[focusedIndex];
      emit("update_marquee", {
        title: game.title,
        marquee_path: game.marquee_path,
        wheel_path: game.wheel_path,
        system: selectedSystem?.display_name || selectedSystem?.name
      });
    }
  }, [focusedIndex, games, currentView, selectedSystem]);

  return (
    <div className="app-container">
      <FadeOverlay 
        visible={fadeVisible} 
        gameName={fadeInfo.game} 
        systemName={fadeInfo.system} 
        config={fadeConfig}
      />
      
      {pauseVisible && (
        <PauseMenu 
          gameName={fadeInfo.game} 
          onClose={() => setPauseVisible(false)}
          onExitGame={() => {
            setPauseVisible(false);
            invoke('stop_game', { emulator: selectedSystem?.name || 'mame' });
          }}
        />
      )}

      {currentView === 'systems' && (
        <AttractMode
          games={games}
          onPlayGame={(game) => {
            handlePlayGame(game);
          }}
          onExit={() => {}}
        />
      )}
      
      <div className="search-overlay">
        {currentView !== "menu" && (
          <input 
            type="text" 
            placeholder="🔍 Search..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedSystem) loadGames(selectedSystem.name, e.target.value);
            }}
            className="search-input"
          />
        )}
      </div>

      {currentView === "menu" && (
        <ViewTransition transitionType="slide" direction="left">
          <MainMenu
            onScanROMs={handleScanROMs}
            onSelectSystem={() => setCurrentView("systems")}
            onShowOperator={() => setCurrentView("operator")}
            loading={loading}
            scanProgress={scanProgress}
          />
        </ViewTransition>
      )}

      {currentView === "systems" && (
        <ViewTransition transitionType="slide" direction="right">
          <SystemSelect
            systems={systems}
            onSelectSystem={handleSelectSystem}
            onBack={handleBack}
            loading={loading}
            focusedIndex={focusedIndex}
          />
        </ViewTransition>
      )}

      {currentView === "games" && selectedSystem && (
        <ViewTransition transitionType="fade">
          <GameList
            system={selectedSystem}
            games={games}
            onPlayGame={handlePlayGame}
            onBack={handleBack}
            loading={loading}
            focusedIndex={focusedIndex}
          />
        </ViewTransition>
      )}

      {currentView === "operator" && (
        <ViewTransition transitionType="scale">
          <OperatorPanel />
        </ViewTransition>
      )}

      {showSaveStateModal && pendingGame && (
        <SaveStateModal
          game={pendingGame}
          saveStates={saveStatesList}
          onPlayNew={() => executeLaunch(pendingGame, null)}
          onPlayState={(state) => executeLaunch(pendingGame, state)}
          onCancel={() => {
            setShowSaveStateModal(false);
            setPendingGame(null);
          }}
        />
      )}
    </div>
  );
}
