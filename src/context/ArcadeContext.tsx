import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTauri } from '../hooks/useTauri';

export interface System {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  gameCount: number;
  lastPlayed?: string;
  totalPlaytime?: number;
}

export interface Game {
  id: string;
  name: string;
  year?: string;
  manufacturer?: string;
  players?: number;
  rating?: number;
  description?: string;
  boxArtUrl?: string;
}

interface ArcadeContextType {
  // State
  systems: System[];
  games: Game[];
  selectedSystem: System | null;
  selectedGame: Game | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadSystems: () => Promise<void>;
  loadGames: (systemId: string) => Promise<void>;
  selectSystem: (system: System) => Promise<void>;
  selectGame: (game: Game) => void;
  launchGame: () => Promise<void>;
  scanRoms: () => Promise<void>;
}

const ArcadeContext = createContext<ArcadeContextType | undefined>(undefined);

export const ArcadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tauri = useTauri();

  const [systems, setSystems] = useState<System[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load systems from database
  const loadSystems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const emulators = await tauri.listEmulators();

      // Convert emulators to systems (mock data - replace with real DB query)
      const systemsData: System[] = emulators.map((emu: any) => ({
        id: emu.id || emu.name.toLowerCase(),
        name: emu.name || 'Unknown',
        icon: emu.icon,
        color: emu.color,
        gameCount: 0, // Would come from DB
        lastPlayed: undefined,
        totalPlaytime: 0,
      }));

      setSystems(systemsData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load systems';
      setError(errorMsg);
      console.error('Error loading systems:', err);
    } finally {
      setLoading(false);
    }
  }, [tauri]);

  // Load games for selected system
  const loadGames = useCallback(async (systemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const gamesData = await tauri.listGames(systemId);

      // Convert to Game interface (mock structure)
      const formattedGames: Game[] = gamesData.map((game: any) => ({
        id: game.id || game.crc32,
        name: game.name || 'Unknown Game',
        year: game.year,
        manufacturer: game.manufacturer,
        players: game.players || 1,
        rating: game.rating,
        description: game.description,
        boxArtUrl: `/media/${systemId}/Images/Boxes/${game.name}.png`,
      }));

      setGames(formattedGames);
      if (formattedGames.length > 0) {
        setSelectedGame(formattedGames[0]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load games';
      setError(errorMsg);
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [tauri]);

  // Select system and load its games
  const selectSystem = useCallback(async (system: System) => {
    setSelectedSystem(system);
    await loadGames(system.id);
  }, [loadGames]);

  // Select game
  const selectGameHandler = useCallback((game: Game) => {
    setSelectedGame(game);
  }, []);

  // Launch game with session tracking
  const launchGameHandler = useCallback(async () => {
    if (!selectedGame || !selectedSystem) {
      setError('No game selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create game session in database
      const gameIdNum = parseInt(selectedGame.id, 10);
      const sessionId = await tauri.createGameSession(gameIdNum, 1);

      // Launch game with monitoring (crash detection, window detection)
      await tauri.launchGameWithMonitoring(gameIdNum, selectedSystem.name);

      // Store session ID in session storage for later cleanup
      sessionStorage.setItem('currentGameSessionId', sessionId.toString());
      sessionStorage.setItem('currentGameStartTime', Date.now().toString());

      console.log(`Launched ${selectedGame.name} on ${selectedSystem.name} (session: ${sessionId})`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to launch game';
      setError(errorMsg);
      console.error('Error launching game:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedSystem, tauri]);

  // Scan ROMs
  const scanRomsHandler = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await tauri.scanRoms();
      // Reload systems after scan
      await loadSystems();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan ROMs';
      setError(errorMsg);
      console.error('Error scanning ROMs:', err);
    } finally {
      setLoading(false);
    }
  }, [tauri, loadSystems]);

  // Load systems on mount
  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const value: ArcadeContextType = {
    systems,
    games,
    selectedSystem,
    selectedGame,
    loading,
    error,
    loadSystems,
    loadGames,
    selectSystem,
    selectGame: selectGameHandler,
    launchGame: launchGameHandler,
    scanRoms: scanRomsHandler,
  };

  return (
    <ArcadeContext.Provider value={value}>
      {children}
    </ArcadeContext.Provider>
  );
};

/**
 * Hook to use Arcade context
 */
export const useArcade = (): ArcadeContextType => {
  const context = useContext(ArcadeContext);
  if (!context) {
    throw new Error('useArcade must be used within ArcadeProvider');
  }
  return context;
};

export default ArcadeContext;
