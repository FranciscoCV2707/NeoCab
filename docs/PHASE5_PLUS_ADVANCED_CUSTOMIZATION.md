# NeoCab Advanced Customization & Deployment

**Objetivo:** Transformar NeoCab en un producto profesional y completamente personalizable, comparable a HyperSpin + Maximus Arcade.

---

## 1. INSTALABLE BUNDLED (Standalone)

### 1.1 Windows Installer (NSIS)
**Estructura:**
```
NeoCab-3.0-Setup.exe (150-300MB)
├── Tauri bundled app + WebView2 runtime
├── All emulator stubs (MAME, RetroArch, etc)
├── SQLite database + default config
├── Default media (wheels, backgrounds)
├── Default themes (Classic, Neon, Cyberpunk)
└── Installation path: C:\Program Files\NeoCab\
```

**Features:**
- Auto-detect WebView2, instalar si falta
- Create ROM folders: C:\Games\MAME\, C:\Games\SNES\, etc
- Register file associations (.mame, .nes → launch via NeoCab)
- Add Start Menu shortcuts
- First-run wizard
- Auto-update check

**Script:** `installer/windows/setup.nsi` (NSIS 3.x)

### 1.2 Linux AppImage (Single File)
**Estructura:**
```
neocab-3.0-amd64.AppImage (200-350MB)
├── Self-contained Tauri app
├── All runtime dependencies
├── Emulator references
├── SQLite database
└── chmod +x, ejecutable directo
```

**Features:**
- No system dependencies required
- auto-mount /tmp para runtime
- Desktop integration (install to ~/.local/share/applications/)

### 1.3 macOS DMG (Future)
```
NeoCab-3.0.dmg
├── NeoCab.app (signed + notarized)
├── emulators/ folder
└── ReadMe.txt (setup instructions)
```

---

## 2. ADVANCED THEME SYSTEM

### 2.1 File Structure (Directories)
```
~/NeoCab/
├── Themes/
│   ├── Classic/
│   │   ├── theme.json          ← Theme metadata + colors
│   │   ├── styles.css          ← Custom component styling
│   │   ├── preview.png         ← Theme screenshot
│   │   └── fonts/
│   │       ├── arcade.ttf
│   │       ├── digital.ttf
│   │       └── neon.ttf
│   ├── Neon/
│   ├── Cyberpunk/
│   └── Custom-User-Theme/      ← User can create
├── Media/
│   ├── Systems/
│   │   ├── mame/
│   │   │   ├── Wheel/          ← Wheel artwork
│   │   │   ├── Box/            ← Box art
│   │   │   ├── Background/     ← Game select backdrop
│   │   │   ├── Marquee/        ← Arcade machine signage
│   │   │   └── Cabinet/        ← Full cabinet artwork
│   │   ├── snes/
│   │   ├── genesis/
│   │   └── ...
│   └── Global/
│       ├── Logos/              ← System logos
│       ├── Buttons/            ← Input button icons
│       └── Effects/            ← Transition animations
└── Config/
    ├── app.yaml
    ├── arcade.yaml
    ├── controls.yaml
    └── personalization.yaml
```

### 2.2 Theme JSON Format
```json
{
  "name": "Classic Arcade",
  "version": "1.0",
  "author": "NeoCab Team",
  "description": "Authentic 80s arcade cabinet aesthetic",
  "colors": {
    "primary": "#ff6b00",
    "secondary": "#1a1a1a",
    "accent": "#ffcc00",
    "text": "#ffffff",
    "background": "#0a0a0a",
    "success": "#00c853",
    "error": "#ff1744"
  },
  "fonts": {
    "ui": "arcade.ttf",
    "display": "digital.ttf",
    "menu": "arcade.ttf"
  },
  "wheel": {
    "itemSize": 120,
    "itemSpacing": 15,
    "animationDuration": 300,
    "selectedColor": "#ff6b00",
    "unselectedColor": "#666666"
  },
  "overlay": {
    "coinPosition": "top-right",
    "timerPosition": "bottom-right",
    "statsOpacity": 0.8,
    "animationStyle": "smooth"
  },
  "transitions": {
    "wheelRotation": "easeOutCubic",
    "pageChange": "fadeInOut",
    "duration": 300
  },
  "media": {
    "showWheels": true,
    "showBoxArt": true,
    "showBackgrounds": true,
    "backgroundOpacity": 0.7,
    "wheelSize": "large"
  }
}
```

### 2.3 CSS Variable Injection
```css
:root {
  --primary-color: var(--theme-primary);
  --secondary-color: var(--theme-secondary);
  --accent-color: var(--theme-accent);
  --text-color: var(--theme-text);
  --background-color: var(--theme-background);
  --wheel-item-size: var(--theme-wheel-itemSize);
  --wheel-animation: var(--theme-wheel-animationDuration);
  --font-ui: var(--theme-fonts-ui);
}

.game-list {
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--font-ui);
}

.coin-overlay {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  border-color: var(--accent-color);
  color: var(--text-color);
}
```

---

## 3. THEME CUSTOMIZATION UI (Integrated Editor)

### 3.1 Customization Panel Location
**Operator Menu → Themes → Customize Current Theme**

```
┌─────────────────────────────────────────────────┐
│  Theme Customization          [X]               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ Colors                                       │
│  ├─ Primary Color:    [████] #ff6b00  [Pick]  │
│  ├─ Secondary Color:  [████] #1a1a1a  [Pick]  │
│  ├─ Accent Color:     [████] #ffcc00  [Pick]  │
│  └─ Text Color:       [████] #ffffff  [Pick]  │
│                                                 │
│  ▼ Wheel Settings                              │
│  ├─ Item Size:        [▁▁▁▁▂] 120px            │
│  ├─ Item Spacing:     [▁▁▂▁▁] 15px             │
│  ├─ Animation Speed:  [▁▁▁▂▁] 300ms            │
│  └─ Style: ◯ Smooth  ◯ Snappy  ◯ Bouncy      │
│                                                 │
│  ▼ Media Settings                              │
│  ├─ [✓] Show Wheels                            │
│  ├─ [✓] Show Box Art                           │
│  ├─ [✓] Show Backgrounds                       │
│  └─ Background Opacity: [▁▁▁▂▁] 70%           │
│                                                 │
│  ▼ Fonts                                        │
│  ├─ UI Font: [Classic Font      ▼]             │
│  ├─ Display: [Digital-7 Font    ▼]             │
│  └─ Menu:    [Arcade Font       ▼]             │
│                                                 │
│  ┌─ LIVE PREVIEW ────────────────────────────┐ │
│  │ [Game Select Wheel Demo]                   │ │
│  │ Shows real-time theme changes              │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  [Reset to Defaults]  [Save as New Theme]  [✓] │
└─────────────────────────────────────────────────┘
```

### 3.2 Live Preview System
**Real-time rendering of changes:**
```typescript
// src/components/customization/ThemeEditor.tsx

const [preview, setPreview] = useState<Theme>(currentTheme);
const [previewMode, setPreviewMode] = useState<'wheel' | 'game' | 'overlay'>('wheel');

useEffect(() => {
  // Apply CSS variables instantly
  document.documentElement.style.setProperty(
    '--theme-primary',
    preview.colors.primary
  );
  // Re-render preview component
}, [preview]);

return (
  <div className="theme-editor">
    <ColorPicker
      label="Primary Color"
      value={preview.colors.primary}
      onChange={(color) => setPreview({
        ...preview,
        colors: { ...preview.colors, primary: color }
      })}
    />
    <SliderControl
      label="Wheel Size"
      min={80}
      max={160}
      value={preview.wheel.itemSize}
      onChange={(size) => setPreview({
        ...preview,
        wheel: { ...preview.wheel, itemSize: size }
      })}
    />
    <ThemePreview
      theme={preview}
      mode={previewMode}
      onModeChange={setPreviewMode}
    />
  </div>
);
```

### 3.3 Theme Storage & Export
**Save custom themes locally:**
```bash
~/NeoCab/Themes/My-Custom-Theme/
├── theme.json
├── styles.css (overrides)
├── preview.png
└── metadata.json (creation date, author)
```

**Share themes:**
- Export as `.neotheme` (ZIP with all files)
- Share via community folder/GitHub
- One-click import: drag & drop `.neotheme` → auto-install

---

## 4. MEDIA MANAGEMENT UI

### 4.1 Media Browser (Built-in)
**Operator Menu → Media Manager**

```
┌────────────────────────────────────────────────┐
│  Media Manager              [✓]                │
├────────────────────────────────────────────────┤
│                                                │
│  System: [MAME ▼]   Folder: [Wheel ▼]        │
│                                                │
│  [📁]  [📋]  [🔍]                             │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Pac-Man.png         [512×512] 245KB      │ │
│  │ [Preview ▶]  [Delete] [Rename]           │ │
│  │                                          │ │
│  │ Donkey Kong.png     [600×600] 320KB      │ │
│  │ [Preview ▶]  [Delete] [Rename]           │ │
│  │                                          │ │
│  │ Galaga.png          [512×512] 198KB      │ │
│  │ [Preview ▶]  [Delete] [Rename]           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Status: 3 wheels loaded for MAME              │
│  Missing: 40 games without wheel artwork       │
│                                                │
│  [Import from Folder] [Download Missing] [✓] │
└────────────────────────────────────────────────┘
```

### 4.2 Auto-Organization
**Automatic media detection & organization:**
```rust
// src-tauri/src/core/media_manager.rs

pub struct MediaManager {
    media_root: PathBuf,
}

impl MediaManager {
    pub async fn scan_and_organize(&self) -> Result<MediaScanReport> {
        // Scan all media folders
        // Match images to games via filename/CRC
        // Create thumbnails
        // Report missing/duplicate artwork
        // Organize into correct system folders
    }

    pub async fn import_from_hyperspin(&self, hyperspin_path: &Path) -> Result<()> {
        // Detect HyperSpin installation
        // Copy wheels, boxes, backgrounds
        // Convert file formats if needed
        // Organize into NeoCab structure
    }
}
```

---

## 5. FRONT-END COMPONENTS (Customization-Ready)

### 5.1 Modular Component System
```typescript
// Components accept theme props + media paths

<HyperSpinWheel
  theme={currentTheme}
  items={games}
  mediaPath={`~/NeoCab/Media/Systems/${system}/Wheel/`}
  showWheelArt={theme.media.showWheels}
  wheelSize={theme.wheel.itemSize}
  animationDuration={theme.wheel.animationDuration}
/>

<GameListPanel
  theme={currentTheme}
  games={selectedGames}
  boxArtPath={`~/NeoCab/Media/Systems/${system}/Box/`}
  showBoxArt={theme.media.showBoxArt}
  backgroundColor={theme.colors.background}
/>

<CoinOverlay
  theme={currentTheme}
  position={theme.overlay.coinPosition}
  animationStyle={theme.overlay.animationStyle}
/>
```

### 5.2 Default Assets
```
public/assets/
├── themes/
│   ├── classic/
│   ├── neon/
│   └── cyberpunk/
├── media/
│   ├── default-wheels/
│   ├── default-backgrounds/
│   ├── system-logos/
│   └── button-icons/
├── fonts/
│   ├── arcade.ttf
│   ├── digital-7.ttf
│   └── neon.ttf
└── transitions/
    ├── fade.gif
    ├── slide.gif
    └── spin.gif
```

---

## 6. DEPLOYMENT STRATEGY

### 6.1 Build Process
```bash
# Bundle everything into one installer

npm run build:windows
# → NeoCab-3.0-Setup.exe (300MB, all included)

npm run build:linux
# → neocab-3.0-amd64.AppImage (250MB, all included)

npm run build:portable
# → neocab-portable.zip (extract & run anywhere)
```

### 6.2 First-Run Setup Wizard
**Auto-runs on first launch:**

**Step 1: Welcome**
- Language selection
- License agreement
- Create ROM folders

**Step 2: ROMs & Emulators**
- Scan for ROMs
- Enable/disable emulators
- Configure emulator paths

**Step 3: Hardware** (optional)
- GPIO/Arduino setup
- Coin detection test
- Solenoid test

**Step 4: Theme**
- Select default theme
- Customize colors
- Media import from HyperSpin

**Step 5: Controls**
- Input device detection
- Button mapping
- Deadzone calibration

**Step 6: Finish**
- Create first game session
- Operator PIN setup
- Launch into main UI

---

## 7. COMMUNITY & EXTENSIBILITY

### 7.1 Theme Marketplace (Future)
- Online repository of user-created themes
- One-click install from NeoCab
- Rating/reviews system
- Version management

### 7.2 Plugin System (Phase 6+)
```rust
// Plugin interface for third-party extensions
pub trait NeoCabPlugin {
    fn name(&self) -> &str;
    fn on_game_launch(&mut self, game: &Game) -> Result<()>;
    fn on_theme_change(&mut self, theme: &Theme) -> Result<()>;
    fn render_ui(&self) -> Option<String>; // React component
}
```

### 7.3 Import/Export
- HyperSpin configuration import
- Maximus Arcade compatibility layer
- Game metadata import from databases
- Save states cloud sync (future)

---

## 8. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│              NeoCab Professional Edition                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  User Interface Layer (React 19)                 │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • HyperSpin Wheel (customizable)                 │  │
│  │ • Game List Panel (theme-aware)                  │  │
│  │ • Theme Editor (live preview)                    │  │
│  │ • Media Manager (asset browser)                  │  │
│  │ • Operator Panel (full control)                  │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │  Theme & Media Engine                            │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • CSS Variable Injection                         │  │
│  │ • Image Cache (wheels, boxes, backgrounds)       │  │
│  │ • Font Loading (TTF/OTF)                         │  │
│  │ • Animation System (transitions, easing)         │  │
│  │ • Media Scanner & Organizer                      │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │  Backend Logic (Rust + Tauri)                    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • Theme Manager (load/save/validate)             │  │
│  │ • Media Manager (scan/import/organize)           │  │
│  │ • Customization Service (preview/persist)        │  │
│  │ • Emulator Adapters (all systems)                │  │
│  │ • Game Library (ROM scanner)                     │  │
│  │ • Coin/Timer/Input Systems                       │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │  Data Layer                                      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • SQLite Database (games, sessions, config)      │  │
│  │ • File System (themes, media, ROMs)              │  │
│  │ • Config YAML (app, arcade, personalization)     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Installers                                             │
│  • Windows: NeoCab-Setup.exe (bundled + WebView2)       │
│  • Linux: neocab-amd64.AppImage (standalone)            │
│  • Portable: neocab-portable.zip                        │
└─────────────────────────────────────────────────────────┘
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 5.1: Advanced Themes (2-3 weeks)
- [ ] Theme JSON schema + validator
- [ ] CSS variable system
- [ ] Multiple built-in themes (5+)
- [ ] Theme editor UI
- [ ] Live preview system
- [ ] Save/export custom themes

### Phase 5.2: Media Management (2 weeks)
- [ ] Media folder structure
- [ ] Media browser UI
- [ ] HyperSpin import tool
- [ ] Thumbnail generation
- [ ] Metadata caching

### Phase 5.3: Installer Bundling (1-2 weeks)
- [ ] NSIS Windows installer
- [ ] Linux AppImage builder
- [ ] First-run wizard
- [ ] Auto-update system

### Phase 5.4: Polish & Testing (1 week)
- [ ] Full QA across themes
- [ ] Performance optimization
- [ ] Documentation + guides
- [ ] Community feedback

---

## 10. SUCCESS METRICS

✅ **Professional-grade customization** - Comparable to HyperSpin  
✅ **Bundled installer** - No dependencies to install  
✅ **Live theme preview** - Real-time visual feedback  
✅ **Media management** - Browse, import, organize assets  
✅ **Community-ready** - Easy to share themes & media  
✅ **Arcade authentic** - Full cabinet aesthetic support  

---

**This creates a complete, professional arcade cabinet OS that users can fully customize and deploy standalone.**
