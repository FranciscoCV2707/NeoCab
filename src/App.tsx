import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import GameList from "./components/GameList";
import SystemSelect from "./components/SystemSelect";
import MainMenu from "./components/MainMenu";
import "./App.css";

interface Game {
  id: number;
  title: string;
  system_id: number;
  rom_path: string;
  crc32?: string;
}

interface System {
  id: number;
  name: string;
  display_name: string;
  extensions: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<"menu" | "systems" | "games">(
    "menu"
  );
  const [systems, setSystems] = useState<System[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState("");

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    setLoading(true);
    try {
      // In a real app, this would call a get_systems command
      // For now, we'll initialize with defaults
      setSystems([
        { id: 1, name: "nes", display_name: "NES", extensions: "nes,zip" },
        { id: 2, name: "snes", display_name: "SNES", extensions: "smc,sfc,zip" },
        { id: 3, name: "genesis", display_name: "Genesis", extensions: "md,bin,zip" },
        { id: 4, name: "mame", display_name: "MAME", extensions: "zip,7z" },
        { id: 5, name: "gb", display_name: "Game Boy", extensions: "gb,gbc,zip" },
        { id: 6, name: "psx", display_name: "PlayStation 1", extensions: "iso,cue,bin,zip" },
        { id: 7, name: "n64", display_name: "Nintendo 64", extensions: "z64,n64,zip" },
      ]);
    } catch (error) {
      console.error("Failed to load systems:", error);
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
      // Refresh games list after scan
      setTimeout(() => {
        setCurrentView("games");
        setScanProgress("");
      }, 2000);
    } catch (error) {
      setScanProgress(`Scan failed: ${error}`);
      console.error("ROM scan failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSystem = (system: System) => {
    setSelectedSystem(system);
    setCurrentView("games");
    // In a real app, load games for this system from database
    setGames([
      {
        id: 1,
        title: "Game 1",
        system_id: system.id,
        rom_path: "./roms/game1.zip",
      },
      {
        id: 2,
        title: "Game 2",
        system_id: system.id,
        rom_path: "./roms/game2.zip",
      },
    ]);
  };

  const handlePlayGame = async (game: Game) => {
    try {
      const emulator = selectedSystem?.name || "mame";
      await invoke("launch_game", {
        gameId: game.id,
        emulator: emulator,
      });
    } catch (error) {
      console.error("Failed to launch game:", error);
    }
  };

  const handleBack = () => {
    if (currentView === "games") {
      setCurrentView("systems");
    } else if (currentView === "systems") {
      setCurrentView("menu");
    }
  };

  return (
    <div className="app">
      {currentView === "menu" && (
        <MainMenu
          onScanROMs={handleScanROMs}
          onSelectSystem={() => setCurrentView("systems")}
          loading={loading}
          scanProgress={scanProgress}
        />
      )}

      {currentView === "systems" && (
        <SystemSelect
          systems={systems}
          onSelectSystem={handleSelectSystem}
          onBack={handleBack}
          loading={loading}
        />
      )}

      {currentView === "games" && selectedSystem && (
        <GameList
          system={selectedSystem}
          games={games}
          onPlayGame={handlePlayGame}
          onBack={handleBack}
          loading={loading}
        />
      )}
    </div>
  );
}
