// themes-shell.jsx — shared arcade shell helper used by every theme.
// Provides: ARCADE_MENU + SETTINGS_MENU data, useArcadeShell() hook
// (screen state machine with home/systems/wheel/settings/themes),
// and useArcadeKeys() keyboard handler.

const ARCADE_MENU = [
  { id: 'play',     label: 'Play',       sub: 'select a system',   icon: '▶' },
  { id: 'favs',     label: 'Favorites',  sub: 'pinned titles',     icon: '★' },
  { id: 'recent',   label: 'Recent',     sub: 'continue session',  icon: '↻' },
  { id: 'shuffle',  label: 'Shuffle',    sub: 'surprise me',       icon: '?' },
  { id: 'settings', label: 'Settings',   sub: 'themes & options',  icon: '⚙' },
];

const SETTINGS_MENU = [
  { id: 'themes',   label: 'Themes',         sub: 'change frontend look',     icon: '◈' },
  { id: 'video',    label: 'Video',          sub: 'scanlines · glow · crt',   icon: '▢' },
  { id: 'audio',    label: 'Audio',          sub: 'attract sfx · music',      icon: '◐' },
  { id: 'controls', label: 'Controls',       sub: 'buttons · joystick',       icon: '⌘' },
  { id: 'cabinet',  label: 'Cabinet',        sub: 'resolution · 16:9 / 4:3',  icon: '▣' },
  { id: 'scraper',  label: 'Scraper',        sub: 'fetch artwork',            icon: '⌕' },
  { id: 'back',     label: 'Back to Menu',   sub: 'return home',              icon: '←' },
];

function resolveMenuShortcut(id, allGames) {
  if (id === 'favs')    return { kind: 'favs',    games: allGames.filter(g => g.favorite),                                  label: 'Favorites' };
  if (id === 'recent')  return { kind: 'recent',  games: allGames.filter(g => g.lastPlayed && g.lastPlayed !== 'Never'),    label: 'Recent' };
  if (id === 'shuffle') return { kind: 'shuffle', games: [...allGames].sort(() => Math.random() - .5),                       label: 'Shuffle' };
  return null;
}

// Shell state machine.
//   screen:    'home' | 'systems' | 'wheel' | 'settings' | 'themes'
//   shortcut:  set when home menu chose favs/recent/shuffle
//   onChangeTheme(id): called when user picks a theme from the themes panel
function useArcadeShell({ onChangeTheme, defaultSystem = 0 } = {}) {
  const [screen, setScreen]               = React.useState('home');
  const [menuIndex, setMenuIndex]         = React.useState(0);
  const [settingsIndex, setSettingsIndex] = React.useState(0);
  const [themeFocusIndex, setThemeFocus]  = React.useState(0);
  const [sysIndex, setSysIndex]           = React.useState(defaultSystem);
  const [gameIndex, setGameIndex]         = React.useState(0);
  const [shortcut, setShortcut]           = React.useState(null);
  const [lastDir, setLastDir]             = React.useState(null);

  const pulseDir = React.useCallback((d) => {
    setLastDir(d);
    clearTimeout(pulseDir._t);
    pulseDir._t = setTimeout(() => setLastDir(null), 240);
  }, []);

  const openMenuItem = React.useCallback((id, allGames) => {
    if (id === 'settings') { setSettingsIndex(0); setScreen('settings'); return; }
    if (id === 'play')     { setScreen('systems'); return; }
    const sc = resolveMenuShortcut(id, allGames);
    if (sc) { setShortcut(sc); setGameIndex(0); setScreen('wheel'); }
  }, []);

  const openSettingsItem = React.useCallback((id) => {
    if (id === 'themes') {
      // align focus with currently-active theme
      const reg = window.THEME_REGISTRY || [];
      const activeIdx = reg.findIndex(t => window.__neoCabActiveTheme && t.id === window.__neoCabActiveTheme);
      setThemeFocus(activeIdx >= 0 ? activeIdx : 0);
      setScreen('themes');
      return;
    }
    if (id === 'back') { setScreen('home'); return; }
    // other settings options are placeholders for now — flash, no-op
  }, []);

  const pickTheme = React.useCallback((id) => {
    onChangeTheme?.(id);
  }, [onChangeTheme]);

  const enterSystem = React.useCallback((i) => {
    setShortcut(null);
    if (typeof i === 'number') setSysIndex(i);
    setGameIndex(0);
    setScreen('wheel');
  }, []);

  const goBack = React.useCallback(() => {
    if (screen === 'themes')   { setScreen('settings'); return; }
    if (screen === 'settings') { setScreen('home'); return; }
    if (screen === 'wheel')    { setScreen(shortcut ? 'home' : 'systems'); setShortcut(null); return; }
    if (screen === 'systems')  { setScreen('home'); return; }
  }, [screen, shortcut]);

  return {
    screen, setScreen,
    menuIndex, setMenuIndex,
    settingsIndex, setSettingsIndex,
    themeFocusIndex, setThemeFocusIndex: setThemeFocus,
    sysIndex, setSysIndex,
    gameIndex, setGameIndex,
    shortcut, setShortcut,
    lastDir, pulseDir,
    openMenuItem, openSettingsItem, pickTheme,
    enterSystem, goBack,
  };
}

// Common keyboard handler used by every theme.
function useArcadeKeys({ shell, allSystems, games, onLaunch, onToggleFav }) {
  React.useEffect(() => {
    function onKey(e) {
      const k = e.key;
      const { screen, menuIndex, setMenuIndex,
              settingsIndex, setSettingsIndex,
              themeFocusIndex, setThemeFocusIndex,
              sysIndex, setSysIndex,
              gameIndex, setGameIndex,
              openMenuItem, openSettingsItem, pickTheme,
              enterSystem, goBack, pulseDir } = shell;

      if (screen === 'home') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { setMenuIndex(i => (i+1) % ARCADE_MENU.length); pulseDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { setMenuIndex(i => (i-1+ARCADE_MENU.length) % ARCADE_MENU.length); pulseDir('up'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { openMenuItem(ARCADE_MENU[menuIndex].id, window.PACK_GAMES); pulseDir('right'); e.preventDefault(); }
      } else if (screen === 'systems') {
        if (k === 'ArrowRight' || k === 'l' || k === 'd') { setSysIndex(i => Math.min(allSystems.length-1, i+1)); pulseDir('right'); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h' || k === 'a') { setSysIndex(i => Math.max(0, i-1)); pulseDir('left'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { enterSystem(); pulseDir('right'); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { goBack(); pulseDir('left'); e.preventDefault(); }
      } else if (screen === 'wheel') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { if (games.length) setGameIndex(i => Math.min(games.length-1, i+1)); pulseDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { if (games.length) setGameIndex(i => Math.max(0, i-1)); pulseDir('up'); e.preventDefault(); }
        else if (k === 'PageDown') { if (games.length) setGameIndex(i => Math.min(games.length-1, i+5)); e.preventDefault(); }
        else if (k === 'PageUp')   { if (games.length) setGameIndex(i => Math.max(0, i-5)); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { onLaunch?.(games[gameIndex]); pulseDir('right'); e.preventDefault(); }
        else if (k === 'y' || k === 'Y') { onToggleFav?.(games[gameIndex]); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { goBack(); pulseDir('left'); e.preventDefault(); }
      } else if (screen === 'settings') {
        if (k === 'ArrowDown' || k === 'j' || k === 's') { setSettingsIndex(i => (i+1) % SETTINGS_MENU.length); pulseDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k' || k === 'w') { setSettingsIndex(i => (i-1+SETTINGS_MENU.length) % SETTINGS_MENU.length); pulseDir('up'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { openSettingsItem(SETTINGS_MENU[settingsIndex].id); pulseDir('right'); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { goBack(); pulseDir('left'); e.preventDefault(); }
      } else if (screen === 'themes') {
        const reg = window.THEME_REGISTRY || [];
        if (k === 'ArrowRight' || k === 'l') { setThemeFocusIndex(i => (i+1) % reg.length); pulseDir('right'); e.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'h')  { setThemeFocusIndex(i => (i-1+reg.length) % reg.length); pulseDir('left'); e.preventDefault(); }
        else if (k === 'ArrowDown' || k === 'j')  { setThemeFocusIndex(i => (i+1) % reg.length); pulseDir('down'); e.preventDefault(); }
        else if (k === 'ArrowUp' || k === 'k')    { setThemeFocusIndex(i => (i-1+reg.length) % reg.length); pulseDir('up'); e.preventDefault(); }
        else if (k === 'Enter' || k === ' ') { if (reg[themeFocusIndex]) pickTheme(reg[themeFocusIndex].id); e.preventDefault(); }
        else if (k === 'Escape' || k === 'b' || k === 'B') { goBack(); pulseDir('left'); e.preventDefault(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shell, allSystems, games, onLaunch, onToggleFav]);
}

Object.assign(window, { ARCADE_MENU, SETTINGS_MENU, useArcadeShell, useArcadeKeys, resolveMenuShortcut });
