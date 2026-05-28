// home-shared.jsx — shared Home + Settings + ThemeSwitcher panels.
// Each theme keeps its OWN home for visual distinctiveness when it has one,
// but Flux/NeonWall use the shared HomeShell.

// ─── HOME (shared) ─────────────────────────────────────────────────────────
function HomeShell({ shell, themeName, themeTag, totals, onAction }) {
  const menu = window.ARCADE_MENU;
  return (
    <div className="nc-home" data-screen-label="Home · Main Menu">
      <div className="nc-home-left">
        <div className="nc-eyebrow">
          <span className="nc-dot"></span>
          <span>SYSTEM ONLINE · CRT WARM · BUILD 0.7</span>
        </div>

        <div className="nc-wordmark">
          <div className="nc-wordmark-l1">NEO</div>
          <div className="nc-wordmark-l2">CAB</div>
          <div className="nc-wordmark-sub">{themeName.toUpperCase()} <span className="nc-amber">·</span> {themeTag.toUpperCase()}</div>
        </div>

        <div className="nc-stats">
          <div className="nc-stat">
            <div className="nc-k">Total titles</div>
            <div className="nc-v">{totals.titles.toLocaleString()}</div>
          </div>
          <div className="nc-stat">
            <div className="nc-k">Systems</div>
            <div className="nc-v">{totals.systems}</div>
          </div>
          <div className="nc-stat">
            <div className="nc-k">Favorites</div>
            <div className="nc-v">{totals.favorites}</div>
          </div>
          <div className="nc-stat">
            <div className="nc-k">Last session</div>
            <div className="nc-v">TODAY 21:14</div>
          </div>
        </div>

        <div className="nc-ticker">
          <span className="nc-ticker-lbl">NOW SHOWING</span>
          <div className="nc-ticker-track">
            <div className="nc-ticker-inner">
              {[1,2].map(rep => (
                <React.Fragment key={rep}>
                  {window.PACK_GAMES.slice(0, 8).map((g, i) => (
                    <React.Fragment key={`${rep}-${i}`}>
                      <span>{g.title.toUpperCase()}</span>
                      <span className="nc-ticker-pip">◆</span>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="nc-home-right">
        <div className="nc-menu-head">
          <span className="nc-menu-head-line"></span>
          <span className="nc-menu-head-lbl">MAIN MENU</span>
          <span className="nc-menu-head-line"></span>
        </div>
        <div className="nc-menu">
          {menu.map((it, i) => (
            <button
              key={it.id}
              className={'nc-menu-item' + (i === shell.menuIndex ? ' is-active' : '')}
              onClick={() => { shell.setMenuIndex(i); onAction(it.id); }}
              tabIndex={-1}>
              <span className="nc-mi-num">{String(i+1).padStart(2,'0')}</span>
              <span className="nc-mi-icon">{it.icon}</span>
              <span className="nc-mi-body">
                <span className="nc-mi-label">{it.label}</span>
                <span className="nc-mi-tag">{it.sub}</span>
              </span>
              {i === shell.menuIndex && <span className="nc-mi-arrow">▶</span>}
            </button>
          ))}
        </div>
        <div className="nc-credits">
          INSERT COIN · CREDITS <b>99</b> · FREEPLAY ON
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────
function SettingsShell({ shell }) {
  const items = window.SETTINGS_MENU;
  return (
    <div className="nc-settings" data-screen-label="Settings">
      <div className="nc-settings-head">
        <div className="nc-eyebrow">
          <span className="nc-dot"></span>
          <span>OPTIONS · CABINET SETUP</span>
        </div>
        <div className="nc-settings-title">SETTINGS</div>
        <div className="nc-settings-sub">Configure your NeoCab experience. Press <b>B</b> to go back.</div>
      </div>
      <div className="nc-settings-list">
        {items.map((it, i) => (
          <button
            key={it.id}
            className={'nc-menu-item' + (i === shell.settingsIndex ? ' is-active' : '')}
            onClick={() => { shell.setSettingsIndex(i); shell.openSettingsItem(it.id); }}
            tabIndex={-1}>
            <span className="nc-mi-num">{String(i+1).padStart(2,'0')}</span>
            <span className="nc-mi-icon">{it.icon}</span>
            <span className="nc-mi-body">
              <span className="nc-mi-label">{it.label}</span>
              <span className="nc-mi-tag">{it.sub}</span>
            </span>
            {i === shell.settingsIndex && <span className="nc-mi-arrow">▶</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── THEME SWITCHER PANEL ─────────────────────────────────────────────────
function ThemeSwitcherPanel({ shell, activeId }) {
  const themes = window.THEME_REGISTRY;
  return (
    <div className="nc-themes-panel" data-screen-label="Settings · Themes">
      <div className="nc-themes-head">
        <div className="nc-eyebrow">
          <span className="nc-dot"></span>
          <span>SETTINGS · THEMES</span>
        </div>
        <div className="nc-themes-title">SELECT <b>THEME</b></div>
        <div className="nc-themes-sub">5 arcade frontends, one cabinet. Each theme owns its own UX, palette and tempo.</div>
      </div>

      <div className="nc-themes-grid">
        {themes.map((t, i) => (
          <div
            key={t.id}
            className={'nc-theme-card' + (i === shell.themeFocusIndex ? ' is-focused' : '') + (t.id === activeId ? ' is-active' : '')}
            style={{ '--accent': t.accent }}
            onMouseEnter={() => shell.setThemeFocusIndex(i)}
            onClick={() => shell.pickTheme(t.id)}>
            <div className="nc-tc-preview">
              {window.ThemePreviewSVG && <window.ThemePreviewSVG kind={t.preview} accent={t.accent}/>}
              <div className="nc-tc-scan"></div>
            </div>
            <div className="nc-tc-body">
              {t.id === activeId && <div className="nc-tc-badge">● ACTIVE</div>}
              <div className="nc-tc-name">{t.name}</div>
              <div className="nc-tc-tagline">{t.tagline}</div>
              <div className="nc-tc-insp">INSP · {t.inspiration}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="nc-themes-foot">
        <span><span className="nc-kk">← →</span> Browse</span>
        <span><span className="nc-kk">ENTER</span> Apply theme</span>
        <span><span className="nc-kk">B / ESC</span> Back to settings</span>
      </div>
    </div>
  );
}

Object.assign(window, { HomeShell, SettingsShell, ThemeSwitcherPanel });
