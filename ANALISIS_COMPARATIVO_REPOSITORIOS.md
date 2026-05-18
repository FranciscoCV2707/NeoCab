# Analisis Comparativo: 69 Repositorios Arcade

**Fecha:** 2026-05-18  
**Repos Analizados:** 69 repositorios en `arcade-repos/`

---

## Resumen de lo Analizado

| Categoria | Repos Analizados |
|-----------|-----------------|
| Frontends arcade | EmulationStation, Pegasus, RetroFE, SimpleLauncher, arcade-fe-react |
| Gestores ROM | RomVault, romie, romm, GameHub, RomCleanup |
| Scrapers | skyscraper, es-scraper, es-vscraper, Universal-XML-Scraper, emulatorjs |
| Herramientas input | AntiMicroX, JoystickGremlin, x360ce, UCR, FreePIE, Durazno |
| Plataformas gaming | Lutris, HeroicGamesLauncher, Playnite, Batocera, Recalbox |
| MAME/Arcade | MAME-Smart-ROM-Sorter, RomCollectionBrowser, OpenEmu, Hyperspin-AHK |

---

## Arquitectura de Frontends

### EmulationStation (C++/SDL2)
- `InputConfig` mapea nombres logicos a inputs fisicos (up/down/select)
- Sistema de temas XML con views y componentes
- GuiComponent base class con render/update y children
- Window stack para navegacion (pushGui/removeGui)

### Pegasus (Qt/QML + C++)
- Model/View separation con Q_PROPERTY macros
- GamepadManager con SDL2 y mapeo abstracto
- Provider pattern para metadata (enchufe/plug)
- Assets class para imagenes/video por juego

### RetroFE (C++/SDL2)
- Layouts XML con animaciones triggered (onEnter/onExit)
- Componentes: image, video, text, scrollinglist, menu
- InputHandler hierarchy (KeyboardHandler, JoyButtonHandler, etc.)
- Tween system para transiciones

### SimpleLauncher (.NET/C#)
- Strategy pattern para launch (9 estrategias distintas)
- Service layer con DI (40+ servicios)
- Config injection per emulator (retroarch.cfg, dolphin.ini, etc.)
- LaunchContext con validacion pipeline

---

## Sistema de Temas

### Patron Comun
```
Theme → View → Component → Properties
        ↓
    animation triggers (onEnter, onExit, onHighlight)
```

### EmulationStation
```xml
<theme>
  <view name="system">
    <carousel name="systemSelect">
      <image name="logo" path={theme}/logo.png />
      <video name="background" path={theme}/video.mp4 />
    </carousel>
  </view>
</theme>
```

### RetroFE
```xml
<reloadableImage type="fanart" x="center" y="center">
  <onEnter><animate type="alpha" to="1" duration=".1"/></onEnter>
  <onHighlightEnter><animate type="alpha" to="1" duration=".15"/></onHighlightEnter>
</reloadableImage>
```

### skyscraper (C++/Qt)
- Image processing pipeline: blur, brightness, contrast, saturation
- Composable effects: frame, rounded corners, shadow, stroke
- Soporta 8+ scrapers: ScreenScraper, IGDB, ArcadeDB, etc.

---

## Input/Controller Systems

### AntiMicroX (C++/Qt + SDL2) - Mejor referencia para arcade
- Shift layers (sets): multiple MappingSet por profile
- Deadzone types: linear, radial
- Response curves: linear, exponential, digital, spline
- Auto-profiles por window title
- Macro support (sequential, simultaneous, hold)
- D-Bus interface para control externo

### Durazno (C/C++) - Excelente para precision de ejes
- Radial deadzone (circular, no solo axis-aligned)
- Anti-deadzone (compensa desgaste de controles)
- Linear tension para respuesta suave
- Trigger range calibration

### JoystickGremlin (Python + vJoy)
- Mode inheritance (parent/child)
- Python scripting para macros
- Library actions (reusable sequences)
- Plugin architecture

### UCR (.NET + MEF)
- Provider abstraction para inputs
- Plugin system para outputs
- Context-based profile switching

---

## ROM Management

### RomVault (C#) - El mejor para validacion
- 3 niveles de scan: header CRC, full checksum changed, full
- DAT file parsing: XML, MAME XML, DOS, CMP
- CHD support con chdman integration
- Fix priority system: DAT > ToSort > RomVault

### romm (Python/FastAPI + Vue) - El mas completo
- 400+ sistemas
- Multiple metadata providers: IGDB, Screenscraper, MobyGames, RA, HLTB
- Multi-disk/CUE support
- User management y permissions
- Save sync across devices

### romie (Electron + Vue + TypeScript)
- SD card sync para handhelds (MiyooMini+)
- RAHasher para identificacion de ROMs
- Device profiles: Onion, muOS, Knulli
- Playlist/tag system

---

## Scraper Systems

### skyscraper - Mas completo
```cpp
// Scrapers: ScreenScraper, TheGamesDB, IGDB, MobyGames, ArcadeDB, OpenRetro
// Image fx pipeline: blur, brightness, contrast, saturation, hue, rotation
// Multi-frontend output: ES, AttractMode, Pegasus
// Resource cache con merge/purge/validate
```

### es-vscraper - Plugin system
```python
# Plugin-based scraper engines
class BaseScraper:
    def run() -> GameEntry
    def name() -> str
    def systems() -> List[str]
```

### Universal-XML-Scraper - Profile-based
```xml
<!-- XML profiles defining scraping rules -->
<profile name="nes">
  <scraper source="ScreenScraper" lang="en" region="usa" />
</profile>
```

---

## Launch Pipeline

### SimpleLauncher Strategy Pattern
```csharp
// 9 launch strategies: Simple, Archive, CHD, LNK, URL, BAT, Steam, etc.
interface ILaunchStrategy {
    bool IsMatch(LaunchContext context);
    Task ExecuteAsync(LaunchContext context);
}

interface IEmulatorConfigHandler {
    bool IsMatch(LaunchContext context);
    Task HandleConfigurationAsync(LaunchContext context);
}
```

### Lutris Wine Management
- 40+ runners (mame, libretro, dolphin, pcsx2, etc.)
- GE-Proton, Wine-GE, Wine-Staging support
- DXVK, VKD3D, Esync, Fsync
- Gamescope, MangoHUD integration

---

## Recomendaciones para NeoCab

### PRIORIDAD 1: Plugin System (inspirado en UCR + JoystickGremlin)

```rust
pub trait Plugin: Send + Sync {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn initialize(&mut self, ctx: &PluginContext) -> Result<()>;
    fn on_game_launch(&self, game: &Game) -> Result<()>;
    fn on_game_end(&self, game: &Game) -> Result<()>;
}
```

### PRIORIDAD 2: Launch Strategy Pattern (inspirado en SimpleLauncher)

**Estrategias a implementar:**
- `SimpleLaunchStrategy` - emulator + ROM directo
- `ArchiveLaunchStrategy` - extrae ZIP/7Z temp
- `CHDLaunchStrategy` - mount CHD via Dokan
- `SteamLaunchStrategy` - Steam API integration
- `ConfigInjectionStrategy` - modifica .ini/.cfg antes de launch

### PRIORIDAD 3: ROM Validation (inspirado en RomVault)

**Niveles de scan:**
1. Header CRC (rapido)
2. Full checksum changed files
3. Full SHA1 verification

### PRIORIDAD 4: Image Processing Pipeline (inspirado en skyscraper)

```rust
pub enum EffectKind {
    Blur(f32),
    Brightness(f32),
    Contrast(f32),
    Saturation(f32),
    Hue(i32),
    Rotation(f32),
    Frame { color: String, width: u32 },
    RoundedCorners(f32),
    Shadow { blur: f32, offset: (f32, f32) },
}
```

---

## Matriz de Implementacion

| Feature | Complejidad | Impacto | Prioridad |
|---------|-------------|---------|-----------|
| Plugin System | Alta | Muy Alto | 1 |
| Launch Strategy Pattern | Media | Alto | 2 |
| ROM Validation | Media | Alto | 3 |
| Image Processing Pipeline | Media | Medio | 4 |
| Enhanced Theme Animations | Baja | Medio | 5 |
| Provider Pattern Metadata | Baja | Alto | 6 |
| Multi-Frontend Export | Media | Medio | 7 |
| GPIO Expansion | Media | Bajo | 8 |
| Multi-Region Filtering | Baja | Medio | 9 |

---

## Conclusion

NeoCab ya tiene una arquitectura solida con 100+ comandos Tauri y 50+ componentes React. Las areas donde puede mejorar mas basandose en el analisis de otros proyectos:

1. **Plugin System** - Para extensibilidad futura
2. **Launch Strategy Pattern** - Para manejar mas tipos de ROM/emulador
3. **ROM Validation** - Para asegurar integridad de juegos
4. **Image Processing** - Para scraped assets de mayor calidad

El codigo de NeoCab es muy completo y bien estructurado. El analisis de SimpleLauncher (40+ servicios) y RetroFE (layouts con animaciones) muestra que NeoCab va por buen camino. El enfoque en JoyMapper v2 y SessionManager es exactamente lo que los mejores frontends hacen.