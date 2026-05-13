# Phase 5: Implementation Plan (Customization & Themes)

**Objetivo:** Implementar sistema de themes avanzado, media management y instaladores bundled.
**Estimado:** 3-4 semanas | 60-80 horas
**Status:** ✅ COMPLETADO (2026-05-11)

---

## 📊 RESUMEN DE COMPLETACIÓN

**Fechas:** Semana 1-4 completadas  
**Horas Reales:** ~73-92h invertidas  
**Commits:**
- Week 1: 7be5d22 (Theme Editor)
- Week 2: 7bdabdd (Media Manager)
- Week 3: b685eeb (Build System)
- Week 4: 48f8d14 (Setup Wizard)

**Qué se implementó:**
- ✅ ThemeManager backend completo
- ✅ ThemeEditor component (360 líneas) + 4 sub-componentes
- ✅ MediaManager backend completo (450 líneas)
- ✅ MediaManager React UI (340 líneas)
- ✅ Windows NSIS installer automation
- ✅ Linux AppImage builder
- ✅ 7-step SetupWizard con validación
- ✅ 660+ líneas CSS para theming
- ✅ 12+ Tauri commands (theme + media)

---

## WEEK 1: Theme System & Editor

### Day 1-2: Backend Theme Manager
**File:** `src-tauri/src/core/theme_manager.rs`

```rust
pub struct ThemeManager {
    themes_dir: PathBuf,
    current_theme: Arc<RwLock<Theme>>,
}

impl ThemeManager {
    pub async fn load_theme(&mut self, name: &str) -> Result<Theme> {
        // Load ~/NeoCab/Themes/{name}/theme.json
        // Parse JSON, validate against schema
        // Return Theme struct
    }

    pub async fn save_custom_theme(&mut self, theme: Theme) -> Result<String> {
        // Generate theme name (user-input or auto)
        // Create ~/NeoCab/Themes/{name}/ directory
        // Write theme.json + styles.css + metadata.json
        // Return new theme name
    }

    pub async fn list_themes(&self) -> Result<Vec<ThemeInfo>> {
        // Scan ~/NeoCab/Themes/ directory
        // Return: [name, author, version, preview_image]
    }

    pub async fn preview_theme_changes(&self, changes: HashMap<String, Value>) -> Result<()> {
        // Apply temporary CSS variables for live preview
        // Don't persist to database yet
    }

    pub async fn apply_theme(&mut self, name: &str) -> Result<()> {
        // Load theme
        // Apply to current session
        // Save to database: user_preferences.current_theme
    }
}
```

**Tauri Commands:** `src-tauri/src/commands/theme.rs` (expand existing)

```rust
#[tauri::command]
async fn list_themes(theme_manager: State<'_, ThemeManager>) -> Result<Vec<ThemeInfo>, String>

#[tauri::command]
async fn get_current_theme(theme_manager: State<'_, ThemeManager>) -> Result<Theme, String>

#[tauri::command]
async fn set_theme(name: String, theme_manager: State<'_, ThemeManager>) -> Result<(), String>

#[tauri::command]
async fn save_custom_theme(theme: Theme, theme_manager: State<'_, ThemeManager>) -> Result<String, String>

#[tauri::command]
async fn preview_theme_changes(changes: HashMap<String, Value>, theme_manager: State<'_, ThemeManager>) -> Result<(), String>

#[tauri::command]
async fn export_theme(name: String) -> Result<String, String> // Returns path to .neotheme file

#[tauri::command]
async fn import_theme(path: String) -> Result<String, String> // Returns imported theme name
```

### Day 3: React Theme Editor Component
**File:** `src/components/customization/ThemeEditor.tsx`

```typescript
interface ThemeEditorProps {
  onThemeChange?: (theme: Theme) => void;
  onSave?: (themeName: string) => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(null);
  const [preview, setPreview] = useState<Theme>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Color sections
  const [colors, setColors] = useState({
    primary: "#ff6b00",
    secondary: "#1a1a1a",
    accent: "#ffcc00",
    text: "#ffffff",
    background: "#0a0a0a",
  });

  // Wheel settings
  const [wheelSettings, setWheelSettings] = useState({
    itemSize: 120,
    itemSpacing: 15,
    animationDuration: 300,
  });

  // Media settings
  const [mediaSettings, setMediaSettings] = useState({
    showWheels: true,
    showBoxArt: true,
    showBackgrounds: true,
    backgroundOpacity: 0.7,
  });

  // Live preview on any change
  useEffect(() => {
    const newTheme = {
      ...currentTheme,
      colors,
      wheel: wheelSettings,
      media: mediaSettings,
    };
    setPreview(newTheme);
    setIsDirty(true);
    applyPreviewCSS(newTheme);
  }, [colors, wheelSettings, mediaSettings]);

  const applyPreviewCSS = (theme: Theme) => {
    // Apply CSS variables to document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
  };

  const handleSave = async () => {
    const themeName = await invoke('save_custom_theme', { theme: preview });
    setIsDirty(false);
    // Success toast notification
  };

  const handleReset = () => {
    setColors(currentTheme.colors);
    setWheelSettings(currentTheme.wheel);
    setMediaSettings(currentTheme.media);
    setIsDirty(false);
  };

  return (
    <div className="theme-editor">
      {/* Color picker section */}
      <ColorPickerSection
        colors={colors}
        onChange={(newColors) => setColors(newColors)}
      />

      {/* Sliders section */}
      <SliderSection
        wheelSettings={wheelSettings}
        onChange={(newSettings) => setWheelSettings(newSettings)}
      />

      {/* Media toggles */}
      <MediaSettingsSection
        settings={mediaSettings}
        onChange={(newSettings) => setMediaSettings(newSettings)}
      />

      {/* Live preview */}
      <ThemePreview theme={preview} />

      {/* Buttons */}
      <div className="theme-editor-buttons">
        <button onClick={handleReset} disabled={!isDirty}>
          Reset
        </button>
        <button onClick={handleSave} disabled={!isDirty} className="primary">
          Save Theme
        </button>
      </div>
    </div>
  );
};
```

### Day 4-5: Theme Preview & Sub-components

**Components:**
- `ColorPickerSection.tsx` - Hex color inputs + visual swatches
- `SliderSection.tsx` - Range sliders for sizes/spacing/speeds
- `MediaSettingsSection.tsx` - Checkboxes + opacity slider
- `ThemePreview.tsx` - Real-time preview (wheel demo + game list demo)

**Styling:** `src/components/customization/ThemeEditor.css`

---

## WEEK 2: Media Management

### Day 1-2: Backend Media Manager
**File:** `src-tauri/src/core/media_manager.rs`

```rust
pub struct MediaManager {
    media_root: PathBuf,
    cache: Arc<RwLock<HashMap<String, Vec<MediaFile>>>>,
}

impl MediaManager {
    pub async fn scan_media(&self) -> Result<MediaScanReport> {
        // Scan ~/NeoCab/Media/Systems/{system}/{folder}/
        // Index by system + folder type
        // Generate thumbnails
        // Return: found, missing, duplicates count
    }

    pub async fn import_from_hyperspin(&self, hyperspin_path: &Path) -> Result<()> {
        // Detect HyperSpin installation
        // Copy from ~/HyperSpin/Media/{system}/
        // Auto-organize into NeoCab structure
        // Log progress
    }

    pub async fn get_media_for_game(&self, system: &str, game_id: &str) -> Result<GameMedia> {
        // Return: wheel, box, background for specific game
    }

    pub async fn organize_media(&self) -> Result<OrganizeReport> {
        // Scan all loose media
        // Match to games via filename/CRC
        // Move to correct folders
    }

    pub async fn generate_thumbnails(&self) -> Result<u32> {
        // For all images in Media/
        // Create 256x256 thumbnails
        // Cache in separate folder
        // Return count generated
    }
}
```

**Tauri Commands:**
```rust
#[tauri::command]
async fn scan_media(media_manager: State<'_, MediaManager>) -> Result<MediaScanReport, String>

#[tauri::command]
async fn import_hyperspin(path: String, media_manager: State<'_, MediaManager>) -> Result<(), String>

#[tauri::command]
async fn get_game_media(system: String, game_id: String, media_manager: State<'_, MediaManager>) -> Result<GameMedia, String>

#[tauri::command]
async fn organize_media(media_manager: State<'_, MediaManager>) -> Result<OrganizeReport, String>

#[tauri::command]
async fn list_media_files(system: String, folder: String, media_manager: State<'_, MediaManager>) -> Result<Vec<MediaFile>, String>
```

### Day 3-4: React Media Manager UI
**File:** `src/components/customization/MediaManager.tsx`

```typescript
export const MediaManager: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string>("mame");
  const [selectedFolder, setSelectedFolder] = useState<string>("Wheel");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [scanReport, setScanReport] = useState<MediaScanReport>(null);

  // Load media on mount
  useEffect(() => {
    loadMedia(selectedSystem, selectedFolder);
  }, [selectedSystem, selectedFolder]);

  const handleScanMedia = async () => {
    const report = await invoke('scan_media');
    setScanReport(report);
    // Show toast: "Found 250 images, 40 missing"
  };

  const handleImportHyperSpin = async () => {
    const path = await selectFolder(); // File dialog
    await invoke('import_hyperspin', { path });
    handleScanMedia(); // Re-scan
  };

  const handleOrganizeMedia = async () => {
    const report = await invoke('organize_media');
    // Show: "Moved 30 files, 5 duplicates found"
  };

  return (
    <div className="media-manager">
      <header>
        <h2>Media Manager</h2>
        <div className="controls">
          <button onClick={handleScanMedia}>Scan Media</button>
          <button onClick={handleImportHyperSpin}>Import HyperSpin</button>
          <button onClick={handleOrganizeMedia}>Organize</button>
        </div>
      </header>

      {scanReport && (
        <div className="scan-report">
          <p>Found: {scanReport.found} | Missing: {scanReport.missing} | Duplicates: {scanReport.duplicates}</p>
        </div>
      )}

      <div className="media-browser">
        <div className="sidebar">
          <h3>Systems</h3>
          <SystemList
            selected={selectedSystem}
            onSelect={setSelectedSystem}
          />
        </div>

        <div className="main">
          <div className="folder-tabs">
            {["Wheel", "Box", "Background", "Marquee"].map((folder) => (
              <button
                key={folder}
                className={selectedFolder === folder ? "active" : ""}
                onClick={() => setSelectedFolder(folder)}
              >
                {folder}
              </button>
            ))}
          </div>

          <div className="media-grid">
            {mediaFiles.map((file) => (
              <MediaFileCard
                key={file.id}
                file={file}
                onDelete={() => handleDeleteFile(file.id)}
                onRename={(newName) => handleRenameFile(file.id, newName)}
              />
            ))}
          </div>

          {mediaFiles.length === 0 && (
            <div className="empty-state">
              <p>No media files found</p>
              <button onClick={handleImportHyperSpin}>
                Import from HyperSpin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Day 5: Styling & Polish

**CSS:** `src/components/customization/MediaManager.css`
- Grid layout for media thumbnails
- Hover effects + delete/rename dialogs
- Loading states
- Empty state design

---

## WEEK 3: Installer & Bundling

### Day 1-2: Windows NSIS Installer
**File:** `installer/windows/setup.nsi`

```nsis
!include "MUI2.nsh"
!include "LogicLib.nsh"

; Variables
!define PRODUCT_NAME "NeoCab"
!define PRODUCT_VERSION "3.0.0"
!define PRODUCT_PUBLISHER "NeoCab Team"
!define PRODUCT_WEB_SITE "https://neocab.arcade"

; Installation path
InstallDir "$PROGRAMFILES\NeoCab"

; MUI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Installer sections
Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy executable
  File "target\release\NeoCab.exe"
  File "target\release\NeoCab.dll"
  
  ; Copy assets
  File /r "public\assets\*.*"
  
  ; Create ROM folders
  CreateDirectory "$DOCUMENTS\Games\MAME"
  CreateDirectory "$DOCUMENTS\Games\SNES"
  CreateDirectory "$DOCUMENTS\Games\Genesis"
  
  ; Create config folder
  CreateDirectory "$APPDATA\NeoCab\Themes"
  CreateDirectory "$APPDATA\NeoCab\Media"
  
  ; Copy default theme
  File /r "public\assets\themes\classic\*.*" "$APPDATA\NeoCab\Themes\Classic\"
  
  ; WebView2 installer (if needed)
  ExecWait "$INSTDIR\WebView2Installer.exe"
  
  ; Create Start Menu
  CreateDirectory "$SMPROGRAMS\NeoCab"
  CreateShortCut "$SMPROGRAMS\NeoCab\NeoCab.lnk" "$INSTDIR\NeoCab.exe"
  CreateShortCut "$SMPROGRAMS\NeoCab\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Create Desktop shortcut (optional)
  CreateShortCut "$DESKTOP\NeoCab.lnk" "$INSTDIR\NeoCab.exe"
  
  ; Write uninstall info
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  ; Remove files
  Delete "$INSTDIR\NeoCab.exe"
  Delete "$INSTDIR\NeoCab.dll"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\NeoCab\NeoCab.lnk"
  Delete "$SMPROGRAMS\NeoCab\Uninstall.lnk"
  Delete "$DESKTOP\NeoCab.lnk"
  RMDir "$SMPROGRAMS\NeoCab"
  
  ; Remove installation directory
  RMDir /r "$INSTDIR"
SectionEnd
```

### Day 3: Linux AppImage Builder
**File:** `installer/linux/build-appimage.sh`

```bash
#!/bin/bash

# Build AppImage for Linux

# 1. Build Tauri app
cd src-tauri
cargo build --release

# 2. Create AppDir structure
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# 3. Copy files
cp target/release/neocab AppDir/usr/bin/
cp -r ../public/assets AppDir/usr/share/

# 4. Create .desktop file
cat > AppDir/usr/share/applications/neocab.desktop << EOF
[Desktop Entry]
Name=NeoCab
Exec=neocab
Icon=neocab
Type=Application
Categories=Game;
EOF

# 5. Copy icon
cp ../public/assets/icon.png AppDir/usr/share/icons/hicolor/256x256/apps/neocab.png

# 6. Download and run appimagetool
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage
./appimagetool-x86_64.AppImage AppDir neocab-3.0-amd64.AppImage

# 7. Create checksum
sha256sum neocab-3.0-amd64.AppImage > neocab-3.0-amd64.AppImage.sha256
```

### Day 4-5: First-Run Wizard
**File:** `src/pages/SetupWizard.tsx`

```typescript
export const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<SetupConfig>({});

  const steps = [
    { id: 1, title: "Welcome", component: WelcomeStep },
    { id: 2, title: "ROM Folders", component: ROMFoldersStep },
    { id: 3, title: "Emulators", component: EmulatorsStep },
    { id: 4, title: "Hardware", component: HardwareStep },
    { id: 5, title: "Theme", component: ThemeStep },
    { id: 6, title: "Controls", component: ControlsStep },
    { id: 7, title: "Finish", component: FinishStep },
  ];

  const CurrentStep = steps[step - 1].component;

  return (
    <div className="setup-wizard">
      <div className="wizard-header">
        <h1>NeoCab Setup Wizard</h1>
        <p>Step {step} of {steps.length}</p>
      </div>

      <div className="wizard-progress">
        <div className="progress-bar" style={{ width: `${(step / steps.length) * 100}%` }} />
      </div>

      <div className="wizard-content">
        <CurrentStep
          config={config}
          onUpdate={(newConfig) => setConfig({ ...config, ...newConfig })}
          onNext={() => setStep(step + 1)}
          onBack={() => setStep(step - 1)}
        />
      </div>
    </div>
  );
};
```

---

## WEEK 4: Testing & Polish

### Day 1-2: QA & Bug Fixes
- Test all themes rendering correctly
- Verify media import from HyperSpin
- Test Windows/Linux installers
- Check first-run wizard flow

### Day 3-4: Documentation
- Theme creation guide
- Media management tutorial
- Installer instructions
- Theme sharing guide

### Day 5: Community Beta
- Release beta build
- Collect feedback
- Fix critical issues

---

## BUILD TASKS CHECKLIST

### Backend (Rust)
- [ ] ThemeManager implementation (150 lines)
- [ ] MediaManager implementation (200 lines)
- [ ] Theme commands in Tauri (100 lines)
- [ ] Media commands in Tauri (100 lines)
- [ ] Database tables for themes/media (50 lines migrations)
- [ ] Asset serving endpoints (50 lines)

### Frontend (React)
- [ ] ThemeEditor component (300 lines)
- [ ] ColorPickerSection (80 lines)
- [ ] SliderSection (80 lines)
- [ ] MediaSettingsSection (60 lines)
- [ ] ThemePreview (100 lines)
- [ ] MediaManager component (250 lines)
- [ ] SystemList (50 lines)
- [ ] MediaFileCard (60 lines)
- [ ] SetupWizard (300 lines)
- [ ] All step components (500 lines)
- [ ] Styling/CSS (800 lines)

### Deployment
- [ ] NSIS installer script (200 lines)
- [ ] Linux AppImage builder (100 lines)
- [ ] Build automation scripts (150 lines)
- [ ] WebView2 bundling setup

### Documentation
- [ ] Theme creation guide (500 words)
- [ ] Media management guide (400 words)
- [ ] Installer instructions (300 words)

---

## ESTIMATED TIME BREAKDOWN

```
Week 1 (Theme System):      20 hours
  - Backend ThemeManager      5h
  - Tauri commands            3h
  - React components          8h
  - Styling                   4h

Week 2 (Media Management):   20 hours
  - Backend MediaManager      6h
  - React MediaManager        8h
  - Import tools              4h
  - Styling                   2h

Week 3 (Installer):          15 hours
  - NSIS Windows installer    5h
  - Linux AppImage            5h
  - First-run wizard          4h
  - Build scripts             1h

Week 4 (Testing/Polish):     10 hours
  - QA & bug fixes            4h
  - Documentation             4h
  - Community feedback        2h

TOTAL: ~60-80 hours
```

---

## SUCCESS METRICS

✅ Professional theme customization  
✅ Media management + HyperSpin import  
✅ Bundled standalone installers  
✅ First-run wizard  
✅ Community-ready product  

---

**Listo para iniciar next session!**
