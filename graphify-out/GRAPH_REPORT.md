# Graph Report - .  (2026-05-15)

## Corpus Check
- Large corpus: 247 files · ~178,588 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1256 nodes · 1634 edges · 112 communities (68 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Session & Timer|Core Session & Timer]]
- [[_COMMUNITY_Input & Joystick Mapping|Input & Joystick Mapping]]
- [[_COMMUNITY_React Components|React Components]]
- [[_COMMUNITY_Operator Panels|Operator Panels]]
- [[_COMMUNITY_Game Management|Game Management]]
- [[_COMMUNITY_Adapter Framework|Adapter Framework]]
- [[_COMMUNITY_Models & Data|Models & Data]]
- [[_COMMUNITY_Documentation|Documentation]]
- [[_COMMUNITY_Hardware & GPIO|Hardware & GPIO]]
- [[_COMMUNITY_UI Themes|UI Themes]]
- [[_COMMUNITY_Settings & Config|Settings & Config]]
- [[_COMMUNITY_Module 11|Module 11]]
- [[_COMMUNITY_Module 12|Module 12]]
- [[_COMMUNITY_Module 13|Module 13]]
- [[_COMMUNITY_Module 14|Module 14]]
- [[_COMMUNITY_Module 15|Module 15]]
- [[_COMMUNITY_Module 16|Module 16]]
- [[_COMMUNITY_Module 17|Module 17]]
- [[_COMMUNITY_Module 18|Module 18]]
- [[_COMMUNITY_Module 19|Module 19]]
- [[_COMMUNITY_Module 20|Module 20]]
- [[_COMMUNITY_Module 21|Module 21]]
- [[_COMMUNITY_Module 22|Module 22]]
- [[_COMMUNITY_Module 23|Module 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]
- [[_COMMUNITY_Module 27|Module 27]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 39|Module 39]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]
- [[_COMMUNITY_Module 43|Module 43]]
- [[_COMMUNITY_Module 44|Module 44]]
- [[_COMMUNITY_Module 45|Module 45]]
- [[_COMMUNITY_Module 46|Module 46]]
- [[_COMMUNITY_Module 47|Module 47]]
- [[_COMMUNITY_Module 48|Module 48]]
- [[_COMMUNITY_Module 51|Module 51]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]
- [[_COMMUNITY_Module 56|Module 56]]
- [[_COMMUNITY_Module 57|Module 57]]
- [[_COMMUNITY_Module 58|Module 58]]
- [[_COMMUNITY_Module 59|Module 59]]
- [[_COMMUNITY_Module 60|Module 60]]
- [[_COMMUNITY_Module 61|Module 61]]
- [[_COMMUNITY_Module 62|Module 62]]
- [[_COMMUNITY_Module 63|Module 63]]
- [[_COMMUNITY_Module 64|Module 64]]
- [[_COMMUNITY_Module 65|Module 65]]
- [[_COMMUNITY_Module 66|Module 66]]
- [[_COMMUNITY_Module 67|Module 67]]
- [[_COMMUNITY_Module 68|Module 68]]
- [[_COMMUNITY_Module 69|Module 69]]
- [[_COMMUNITY_Module 70|Module 70]]
- [[_COMMUNITY_Module 71|Module 71]]
- [[_COMMUNITY_Module 73|Module 73]]
- [[_COMMUNITY_Module 74|Module 74]]
- [[_COMMUNITY_Module 75|Module 75]]
- [[_COMMUNITY_Module 76|Module 76]]
- [[_COMMUNITY_Module 77|Module 77]]
- [[_COMMUNITY_Module 78|Module 78]]
- [[_COMMUNITY_Module 79|Module 79]]
- [[_COMMUNITY_Module 80|Module 80]]
- [[_COMMUNITY_Module 81|Module 81]]
- [[_COMMUNITY_Module 82|Module 82]]
- [[_COMMUNITY_Module 83|Module 83]]
- [[_COMMUNITY_Module 84|Module 84]]
- [[_COMMUNITY_Module 87|Module 87]]
- [[_COMMUNITY_Module 89|Module 89]]
- [[_COMMUNITY_Module 90|Module 90]]
- [[_COMMUNITY_Module 91|Module 91]]
- [[_COMMUNITY_Module 92|Module 92]]
- [[_COMMUNITY_Module 93|Module 93]]
- [[_COMMUNITY_Module 94|Module 94]]

## God Nodes (most connected - your core abstractions)
1. `Database` - 38 edges
2. `ShaderManager` - 33 edges
3. `InputManager` - 33 edges
4. `JoyMapper` - 33 edges
5. `t()` - 17 edges
6. `MediaManager` - 16 edges
7. `ThemeManager` - 15 edges
8. `TimerManager` - 14 edges
9. `SessionManager` - 13 edges
10. `EventLoop` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AttractMode()` --calls--> `t()`  [EXTRACTED]
  src/components/AttractMode.tsx → src/i18n.ts
- `GameList()` --calls--> `t()`  [EXTRACTED]
  src/components/GameList.tsx → src/i18n.ts
- `LeaderboardPanel()` --calls--> `t()`  [EXTRACTED]
  src/components/LeaderboardPanel.tsx → src/i18n.ts
- `MainMenu()` --calls--> `t()`  [EXTRACTED]
  src/components/MainMenu.tsx → src/i18n.ts
- `OperatorPanel()` --calls--> `t()`  [EXTRACTED]
  src/components/OperatorPanel.tsx → src/i18n.ts

## Communities (112 total, 44 thin omitted)

### Community 0 - "Core Session & Timer"
Cohesion: 0.08
Nodes (25): Shader, ShaderManager, ShaderParameter, ShaderPreset, ShaderScanStats, ShaderType, ShaderValidation, test_default_crt_shader() (+17 more)

### Community 1 - "Input & Joystick Mapping"
Cohesion: 0.06
Nodes (34): GameFocusedEvent, SaveState, SaveStateModalProps, ViewTransition(), ViewTransitionProps, SOUNDS, useAudio(), useKeyboardNav() (+26 more)

### Community 2 - "React Components"
Cohesion: 0.05
Nodes (39): AuditMode, AuditPanel(), AuditResult, MissingMediaEntry, MissingRomEntry, InputWizard(), JoyMapping, JoyTrigger (+31 more)

### Community 3 - "Operator Panels"
Cohesion: 0.07
Nodes (12): AxisInput, InputButton, InputDevice, InputEvent, InputEventType, InputManager, InputMapping, ProfileAssignment (+4 more)

### Community 4 - "Game Management"
Cohesion: 0.07
Nodes (28): AttractMode(), AttractModeProps, AuditResult, Game, GameList(), GameListProps, SortField, SortOrder (+20 more)

### Community 6 - "Models & Data"
Cohesion: 0.12
Nodes (3): create_profile_from_template(), JoyMapper, MappingSet

### Community 7 - "Documentation"
Cohesion: 0.08
Nodes (22): needs_setup(), determine_shader_path(), get_base_dir(), init_logging(), initialize_app(), run(), run_legacy_app(), run_modern_app() (+14 more)

### Community 8 - "Hardware & GPIO"
Cohesion: 0.06
Nodes (18): AxisDirection, DeadzoneConfig, DeadzoneType, JoyMapping, JoyProfile, JoyTrigger, KeyInjector, LinuxInjector (+10 more)

### Community 9 - "UI Themes"
Cohesion: 0.08
Nodes (13): MediaSettings, OverlaySettings, test_theme_default(), Theme, ThemeColors, ThemeEffects, ThemeFonts, ThemeInfo (+5 more)

### Community 10 - "Settings & Config"
Cohesion: 0.09
Nodes (19): DEFAULT_CONFIG, SetupConfig, SetupWizardProps, STEPS, ConfigureInputStep(), ConfigureInputStepProps, MediaDirectoryStep(), MediaDirectoryStepProps (+11 more)

### Community 11 - "Module 11"
Cohesion: 0.1
Nodes (16): GameScraper, get_screenscraper_system_id(), ScrapedGameInfo, ScrapeProgress, SSDate, SSGame, SSGameResponse, SSGenre (+8 more)

### Community 12 - "Module 12"
Cohesion: 0.1
Nodes (7): ArcadeConfig, SessionConfig, SessionManager, SessionMode, SessionState, SessionStatus, TimedConfig

### Community 13 - "Module 13"
Cohesion: 0.09
Nodes (5): get_active_profile(), set_device_deadzone(), set_response_curve(), start_recording_input(), ArcadeAction

### Community 14 - "Module 14"
Cohesion: 0.09
Nodes (5): list_serial_ports(), ArduinoConfig, ArduinoInterface, test_arduino_config_default(), test_arduino_interface_creation()

### Community 15 - "Module 15"
Cohesion: 0.12
Nodes (9): AppConfig, AppSettings, ArcadeSettings, ConfigManager, DisplaySettings, EmulatorsSettings, GameMode, InputSettings (+1 more)

### Community 16 - "Module 16"
Cohesion: 0.14
Nodes (7): MediaFile, MediaLibrary, MediaManager, MediaStats, MediaType, test_infer_media_type(), test_is_supported_image()

### Community 17 - "Module 17"
Cohesion: 0.12
Nodes (6): import_steam_games(), ScanProgress, scrape_game(), update_game_metadata(), SteamGame, SteamImporter

### Community 18 - "Module 18"
Cohesion: 0.18
Nodes (5): test_timer_creation(), test_timer_start(), TimerManager, TimerState, TimerStatus

### Community 19 - "Module 19"
Cohesion: 0.15
Nodes (9): apply_theme(), get_current_theme(), get_game_theme(), get_theme_css(), list_available_themes(), list_themes(), load_theme(), resolve_game_theme() (+1 more)

### Community 20 - "Module 20"
Cohesion: 0.16
Nodes (3): EventLoop, FrameStats, LegacyGameState

### Community 21 - "Module 21"
Cohesion: 0.16
Nodes (4): CoinEvent, CoinManager, CoinState, test_coin_manager_creation()

### Community 22 - "Module 22"
Cohesion: 0.19
Nodes (9): AuthLevel, OperatorPanel, OperatorStats, SessionStats, SystemHealth, test_invalid_pin(), test_logout(), test_max_attempts() (+1 more)

### Community 23 - "Module 23"
Cohesion: 0.23
Nodes (5): AppState, GameStateManager, test_pause_resume(), test_shutdown(), test_state_transitions()

### Community 24 - "Module 24"
Cohesion: 0.17
Nodes (4): CabinetInfo, EarningsSyncPayload, NetworkManager, NetworkRole

### Community 25 - "Module 25"
Cohesion: 0.19
Nodes (4): RetroArchAdapter, RetroArchCore, test_retroarch_adapter_creation(), test_retroarch_not_running_initially()

### Community 26 - "Module 26"
Cohesion: 0.18
Nodes (8): CoinHardwareExt, HardwareConfig, HardwareMonitor, HardwareType, test_arduino_config(), test_gpio_config(), test_hardware_config_default(), test_hardware_monitor_creation()

### Community 28 - "Module 28"
Cohesion: 0.15
Nodes (3): GPIOCoinDetector, GPIOConfig, test_gpio_config_defaults()

### Community 29 - "Module 29"
Cohesion: 0.19
Nodes (4): MediaLoader, test_media_loader_creation(), test_theme_colors(), ThemeColors

### Community 32 - "Module 32"
Cohesion: 0.24
Nodes (3): HyperSpinMedia, test_cache_key_generation(), test_cache_stats()

### Community 33 - "Module 33"
Cohesion: 0.27
Nodes (3): AutobootManager, test_autoboot_manager_creation(), test_kiosk_mode_toggle()

### Community 34 - "Module 34"
Cohesion: 0.2
Nodes (7): EsGame, Gamelist, HsGame, HyperspinMenu, LaunchBoxData, LbGame, UniversalImporter

### Community 36 - "Module 36"
Cohesion: 0.27
Nodes (3): MameAdapter, test_mame_adapter_creation(), test_mame_not_running_initially()

### Community 39 - "Module 39"
Cohesion: 0.27
Nodes (3): EmulatorMonitor, test_monitor_creation(), test_stop_monitoring()

### Community 40 - "Module 40"
Cohesion: 0.27
Nodes (3): EmulatorDetector, EmulatorInfo, test_detect_all_returns_hashmap()

### Community 41 - "Module 41"
Cohesion: 0.22
Nodes (4): HardwareAction, HardwareEvent, HardwareScript, HardwareScriptEngine

### Community 43 - "Module 43"
Cohesion: 0.28
Nodes (4): get_all_game_media(), get_media(), import_media(), organize_media()

### Community 47 - "Module 47"
Cohesion: 0.32
Nodes (5): GameItem, GameListPanelProps, GameMetadata, GameMetadataEditor(), GameMetadataEditorProps

### Community 51 - "Module 51"
Cohesion: 0.25
Nodes (5): BezelConfig, FadeConfig, ThemeConfig, ThemeElement, ThemeSounds

### Community 64 - "Module 64"
Cohesion: 0.4
Nodes (3): GameRunningOverlayProps, CoinOverlay(), CoinOverlayProps

### Community 65 - "Module 65"
Cohesion: 0.47
Nodes (4): check_timer_timeout(), get_recommended_emulator(), launch_game(), stop_game()

### Community 66 - "Module 66"
Cohesion: 0.6
Nodes (5): clear_logs(), get_log_tail(), get_logs_dir(), list_log_files(), read_log_file()

## Knowledge Gaps
- **194 isolated node(s):** `System`, `ScanProgressPayload`, `View`, `Language`, `Translations` (+189 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initialize_app()` connect `Documentation` to `Core Session & Timer`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `System`, `ScanProgressPayload`, `View` to the rest of the system?**
  _194 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Session & Timer` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Input & Joystick Mapping` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `React Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Operator Panels` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Game Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._