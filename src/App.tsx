import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { useUnifiedInput } from "./hooks/useUnifiedInputHook";
import { InputAction } from "./hooks/useUnifiedInput";
import { useAudio } from "./hooks/useAudio";
import { useTheme } from "./hooks/useTheme";
import { useTranslation, Locale } from "./i18n";
import { useSystemStore } from "./stores/useSystemStore";
import { initThemeHotkey } from "./stores/useThemeStore";
import { dispatchNeoCabEvent } from "./theme/themeEvents";
import { exposeNeoCabAPI } from "./theme/neoCabApi";
import {
  notifyThemeNavigate,
  notifyThemeViewChange,
  notifyThemeFocus,
  notifyThemeSelect,
  notifyThemeBack,
} from "./theme/themePlugin";
import { useGameStore } from "./stores/useGameStore";
import { useUIStore, initUIListeners } from "./stores/useUIStore";
import { Game, SaveState, System } from "./stores/types";
import { FadeOverlay } from "./components/launcher/FadeOverlay";
import { PauseMenu } from "./components/launcher/PauseMenu";
import { ViewTransition } from "./components/ViewTransition";
import GameList from "./components/GameList";
import SystemSelect from "./components/SystemSelect";
import MainMenu from "./components/MainMenu";
import AttractMode from "./components/AttractMode";
import SaveStateModal from "./components/SaveStateModal";
import { OperatorPanel } from "./components/operator/OperatorPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { ToastContainer } from "./components/Toast";
import { toast } from "./stores/useNotificationStore";
import "./App.css";

export default function App() {
  const { currentTheme } = useTheme();
  const { locale, changeLocale } = useTranslation();
  const { playSound, playBGM, stopBGM } = useAudio();

  const systems = useSystemStore((s) => s.systems);
  const selectedSystem = useSystemStore((s) => s.selectedSystem);
  const loading = useSystemStore((s) => s.loading);
  const scanProgress = useSystemStore((s) => s.scanProgress);
  const loadSystems = useSystemStore((s) => s.loadSystems);
  const selectSystem = useSystemStore((s) => s.selectSystem);
  const setScanProgress = useSystemStore((s) => s.setScanProgress);
  const setLoading = useSystemStore((s) => s.setLoading);

  const games = useGameStore((s) => s.games);
  const focusedIndex = useGameStore((s) => s.focusedIndex);
  const loadGames = useGameStore((s) => s.loadGames);
  const setFocusedIndex = useGameStore((s) => s.setFocusedIndex);

  const currentView = useUIStore((s) => s.currentView);
  const fadeVisible = useUIStore((s) => s.fadeVisible);
  const pauseVisible = useUIStore((s) => s.pauseVisible);
  const attractMode = useUIStore((s) => s.attractMode);
  const showSaveStateModal = useUIStore((s) => s.showSaveStateModal);
  const pendingGame = useUIStore((s) => s.pendingGame);
  const saveStatesList = useUIStore((s) => s.saveStatesList);
  const fadeInfo = useUIStore((s) => s.fadeInfo);
  const setView = useUIStore((s) => s.setView);
  const setPauseVisible = useUIStore((s) => s.setPauseVisible);
  const setAttractMode = useUIStore((s) => s.setAttractMode);
  const showSaveStateForGame = useUIStore((s) => s.showSaveStateForGame);
  const hideSaveStateModal = useUIStore((s) => s.hideSaveStateModal);

  useEffect(() => { initUIListeners(); initThemeHotkey(); exposeNeoCabAPI(); }, []);
  useEffect(() => { document.documentElement.setAttribute("lang", locale); }, [locale]);

  useEffect(() => {
    loadSystems();
    const unlisten = (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      return listen<{ current: number; total: number; filename: string }>(
        "scan_progress", (event) => {
          const { current, total, filename } = event.payload;
          const pct = Math.round((current / total) * 100);
          setScanProgress(`Scanning: ${pct}% - ${filename}`);
        }
      );
    })();
    return () => { unlisten.then((f) => f()); };
  }, [loadSystems, setScanProgress]);

  useEffect(() => {
    if (currentView !== "games") playBGM();
  }, [currentView, playBGM]);

  useEffect(() => {
    if (!currentTheme) return;
    const root = document.documentElement;
    const body = document.body;
    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
    }
    if (currentTheme.fonts) {
      Object.entries(currentTheme.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value as string);
      });
    }
    if (currentTheme.layout) {
      root.style.setProperty("--animation-speed", `${currentTheme.layout.animation_speed}ms`);
      root.style.setProperty("--transition-easing", currentTheme.layout.easing);
    }
    if (currentTheme.effects) {
      root.style.setProperty("--glow-intensity", String(currentTheme.effects.glow_intensity));
      root.style.setProperty("--scanlines", currentTheme.effects.scanlines ? "1" : "0");
      root.style.setProperty("--crt-curve", String(currentTheme.effects.crt_curve));
      if (currentTheme.effects.scanlines && !document.getElementById("scanlines-overlay")) {
        const overlay = document.createElement("div");
        overlay.id = "scanlines-overlay";
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 9999;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
        `;
        body.appendChild(overlay);
      } else if (!currentTheme.effects.scanlines) {
        document.getElementById("scanlines-overlay")?.remove();
      }
    }
    body.className = `theme-${(currentTheme.name || "default").toLowerCase().replace(/\s+/g, "-")}`;
  }, [currentTheme]);

  const attractTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetAttractTimer = useCallback(() => {
    if (attractTimer.current) clearTimeout(attractTimer.current);
    if (attractMode) setAttractMode(false);
    attractTimer.current = setTimeout(() => {
      if (currentView === "games" && games.length > 0) setAttractMode(true);
    }, 60000);
  }, [currentView, games.length, attractMode, setAttractMode]);

  useEffect(() => {
    const onActivity = () => resetAttractTimer();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    resetAttractTimer();
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (attractTimer.current) clearTimeout(attractTimer.current);
    };
  }, [resetAttractTimer]);

  const handleScanROMs = async () => {
    setLoading(true);
    setScanProgress("Scanning ROMs...");
    try {
      const result = JSON.parse(await invoke<string>("scan_roms", { romsDir: null }));
      setScanProgress(`Found ${result.games_found} new games!`);
      setTimeout(() => { loadSystems(); if (selectedSystem) loadGames(selectedSystem.name); setScanProgress(""); }, 2000);
    } catch (error) {
      setScanProgress(`Scan failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSystem = useCallback(async (system: System) => {
    playSound("select");
    selectSystem(system);
    setView("games");
    await loadGames(system.name);
  }, [playSound, selectSystem, setView, loadGames]);

  const handlePlayGame = useCallback(async (game: Game) => {
    playSound("select");
    try {
      const states = await invoke<SaveState[]>("get_save_states", { gameId: game.id });
      if (states && states.length > 0) {
        showSaveStateForGame(game, states);
      } else {
        executeLaunch(game, null);
      }
    } catch {
      executeLaunch(game, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSound, showSaveStateForGame]);

  const executeLaunch = useCallback(async (game: Game, _saveState: SaveState | null) => {
    hideSaveStateModal();
    playSound("start");
    stopBGM();
    try {
      const emulator = selectedSystem?.name || "mame";
      await invoke("launch_game", { gameId: game.id.toString(), emulator });
    } catch {
      playSound("error");
      playBGM();
    }
  }, [hideSaveStateModal, playSound, stopBGM, selectedSystem, playBGM]);

  useEffect(() => {
    const unlisten = listen("game_launch_finished", () => {
      playBGM();
    });
    return () => {
      unlisten.then(f => f());
    };
  }, [playBGM]);

  const handleBack = useCallback(() => {
    playSound("back");
    if (currentView === "games") { setView("systems"); setFocusedIndex(0); }
    else if (currentView === "systems") { setView("menu"); setFocusedIndex(0); }
  }, [currentView, playSound, setView, setFocusedIndex]);

  const handleUnifiedAction = useCallback((action: InputAction) => {
    resetAttractTimer();
    if (["up", "down", "left", "right"].includes(action)) playSound("navigate");
    switch (currentView) {
      case "menu":
        if (action === "confirm") {
          playSound("select");
          setView("systems");
          const vc1 = { from: "menu", to: "systems" };
          dispatchNeoCabEvent("neocab:viewchange", vc1);
          notifyThemeViewChange(vc1);
        }
        break;
      case "systems": {
        if (action === "up" || action === "left") {
          const next = Math.max(0, focusedIndex - 1);
          setFocusedIndex(next);
          const nd = { direction: action, fromIndex: focusedIndex, toIndex: next, view: "systems" };
          dispatchNeoCabEvent("neocab:navigate", nd);
          notifyThemeNavigate(nd);
          document.documentElement.dataset.focusedIndex = String(next);
          dispatchNeoCabEvent("neocab:focus", { item: systems[next], index: next, view: "systems" });
          notifyThemeFocus({ item: systems[next], index: next, view: "systems" });
        }
        if (action === "down" || action === "right") {
          const next = Math.min(systems.length - 1, focusedIndex + 1);
          setFocusedIndex(next);
          const nd = { direction: action, fromIndex: focusedIndex, toIndex: next, view: "systems" };
          dispatchNeoCabEvent("neocab:navigate", nd);
          notifyThemeNavigate(nd);
          document.documentElement.dataset.focusedIndex = String(next);
          dispatchNeoCabEvent("neocab:focus", { item: systems[next], index: next, view: "systems" });
          notifyThemeFocus({ item: systems[next], index: next, view: "systems" });
        }
        if (action === "confirm" && systems[focusedIndex]) {
          const sel = { item: systems[focusedIndex], view: "systems" };
          dispatchNeoCabEvent("neocab:select", sel);
          notifyThemeSelect(sel);
          handleSelectSystem(systems[focusedIndex]);
          const vc2 = { from: "systems", to: "games" };
          dispatchNeoCabEvent("neocab:viewchange", vc2);
          notifyThemeViewChange(vc2);
        }
        if (action === "back") {
          const bk = { fromView: "systems" };
          dispatchNeoCabEvent("neocab:back", bk);
          notifyThemeBack(bk);
          handleBack();
          const vc3 = { from: "systems", to: "menu" };
          dispatchNeoCabEvent("neocab:viewchange", vc3);
          notifyThemeViewChange(vc3);
        }
        break;
      }
      case "games": {
        if (action === "up" || action === "left") {
          const next = Math.max(0, focusedIndex - 1);
          setFocusedIndex(next);
          const nd = { direction: action, fromIndex: focusedIndex, toIndex: next, view: "games" };
          dispatchNeoCabEvent("neocab:navigate", nd);
          notifyThemeNavigate(nd);
          document.documentElement.dataset.focusedIndex = String(next);
        }
        if (action === "down" || action === "right") {
          const next = Math.min(games.length - 1, focusedIndex + 1);
          setFocusedIndex(next);
          const nd = { direction: action, fromIndex: focusedIndex, toIndex: next, view: "games" };
          dispatchNeoCabEvent("neocab:navigate", nd);
          notifyThemeNavigate(nd);
          document.documentElement.dataset.focusedIndex = String(next);
        }
        if (action === "confirm" && games[focusedIndex]) {
          const sel = { item: games[focusedIndex], view: "games" };
          dispatchNeoCabEvent("neocab:select", sel);
          notifyThemeSelect(sel);
          handlePlayGame(games[focusedIndex]);
        }
        if (action === "back") {
          const bk = { fromView: "games" };
          dispatchNeoCabEvent("neocab:back", bk);
          notifyThemeBack(bk);
          handleBack();
          const vc4 = { from: "games", to: "systems" };
          dispatchNeoCabEvent("neocab:viewchange", vc4);
          notifyThemeViewChange(vc4);
        }
        if (action === "coin") {
          invoke<string>("session_insert_coin")
            .then((result) => {
              try {
                const data = JSON.parse(result);
                if (data.success) {
                  toast.success("Moneda insertada", `Créditos: ${data.credits || 0}`);
                }
              } catch {
                toast.success("Moneda insertada", "");
              }
            })
            .catch(() => {
              toast.error("Error", "No se pudo insertar la moneda");
            });
        }
        break;
      }
      case "operator":
        if (action === "back") setView("menu");
        break;
      case "settings":
        if (action === "back") setView("menu");
        break;
    }
  }, [currentView, focusedIndex, systems, games, resetAttractTimer, playSound, handleBack, handlePlayGame, handleSelectSystem, setFocusedIndex, setView]);

  useUnifiedInput({ onAction: handleUnifiedAction });

  useEffect(() => {
    if (currentView === "games" && games[focusedIndex]) {
      const g = games[focusedIndex];
      emit("game_focused", {
        title: g.title,
        marquee_path: g.marquee_path,
        image_path: g.wheel_path,
        system_name: selectedSystem?.display_name || selectedSystem?.name,
      });
    }
  }, [focusedIndex, games, currentView, selectedSystem]);

  return (
    <div className="app-container">
      <FadeOverlay visible={fadeVisible} gameName={fadeInfo.game} systemName={fadeInfo.system} />
      {pauseVisible && (
        <PauseMenu
          gameName={fadeInfo.game}
          gameId={games[focusedIndex]?.id || 0}
          emulatorName={selectedSystem?.name || "mame"}
          onClose={() => setPauseVisible(false)}
          onExitGame={() => { setPauseVisible(false); invoke("stop_game", { emulator: selectedSystem?.name || "mame" }); }}
        />
      )}
      {attractMode && (
        <AttractMode games={games} onPlayGame={handlePlayGame} onExit={() => setAttractMode(false)} />
      )}
      <div className="search-overlay">
        {currentView !== "menu" && (
          <input
            type="text"
            placeholder="🔍 Search..."
            onChange={(e) => { if (selectedSystem) loadGames(selectedSystem.name, e.target.value); }}
            className="search-input"
          />
        )}
      </div>
      {currentView === "menu" && (
        <ViewTransition transitionType="slide" direction="left">
          <MainMenu
            onScanROMs={handleScanROMs}
            onSelectSystem={() => setView("systems")}
            onShowOperator={() => setView("operator")}
            onShowSettings={() => setView("settings")}
            loading={loading}
            scanProgress={scanProgress}
            locale={locale}
            onLocaleChange={(l) => changeLocale(l as Locale)}
          />
        </ViewTransition>
      )}
      {currentView === "systems" && (
        <ViewTransition transitionType="slide" direction="right">
          <SystemSelect systems={systems} onSelectSystem={handleSelectSystem} onBack={handleBack} loading={loading} focusedIndex={focusedIndex} />
        </ViewTransition>
      )}
      {currentView === "games" && selectedSystem && (
        <ViewTransition transitionType="fade">
          <GameList system={selectedSystem} games={games} onPlayGame={handlePlayGame} onBack={handleBack} loading={loading} focusedIndex={focusedIndex} />
        </ViewTransition>
      )}
      {currentView === "operator" && (
        <ViewTransition transitionType="scale">
          <OperatorPanel onBack={() => setView("menu")} />
        </ViewTransition>
      )}
      {currentView === "settings" && (
        <ViewTransition transitionType="scale">
          <SettingsPanel onBack={() => setView("menu")} />
        </ViewTransition>
      )}
      {showSaveStateModal && pendingGame && (
        <SaveStateModal
          game={pendingGame}
          saveStates={saveStatesList}
          onPlayNew={() => executeLaunch(pendingGame, null)}
          onPlayState={(state) => executeLaunch(pendingGame, state)}
          onCancel={() => hideSaveStateModal()}
        />
      )}
      <ToastContainer />
    </div>
  );
}
