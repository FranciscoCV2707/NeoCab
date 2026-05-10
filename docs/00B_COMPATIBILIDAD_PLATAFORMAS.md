# 🖥️ ARCADECORE v3 — COMPATIBILIDAD PLATAFORMAS

> **Guía definitiva: Windows 7→11 · Linux · ARM · Raspberry Pi**

---

## 1. WINDOWS 7 SP1 — GUÍA COMPLETA

### Por qué soportar Windows 7

Muchos gabinetes arcade corren en hardware del 2008-2013 con Windows 7 preinstalado.
ArcadeCore está diseñado para correr en ese hardware sin requerir actualización del OS.

### Requisitos Windows 7

```
OS:       Windows 7 SP1 x64 (MÍNIMO con SP1)
CPU:      Intel Core 2 Duo o AMD Phenom (cualquier dual-core 2GHz+)
RAM:      2GB (4GB recomendado)
Disco:    100MB para app + espacio para ROMs
GPU:      DirectX 9c compatible (prácticamente cualquier GPU 2007+)

Software adicional OBLIGATORIO:
  1. Windows 7 Service Pack 1 (si no lo tiene)
  2. Visual C++ 2019 Redistributable x64
  3. WebView2 Runtime (para la UI de Tauri)
  4. .NET Framework 4.5 (para algunos emuladores)
```

### WebView2 en Windows 7

```powershell
# Verificar si WebView2 está instalado:
$reg = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
if (Test-Path $reg) { "WebView2 instalado ✅" } else { "WebView2 NO instalado ❌" }

# Si no está:
# Descargar: https://go.microsoft.com/fwlink/p/?LinkId=2124703
# Instalar silenciosamente:
MicrosoftEdgeWebview2Setup.exe /silent /install
```

### Código Rust: detección y aviso Win7

```rust
// src-tauri/src/utils/platform.rs

/// Información de plataforma en tiempo de ejecución
#[derive(Debug, Clone, serde::Serialize)]
pub struct PlatformInfo {
    pub os:              String,    // "windows", "linux"
    pub os_version:      String,    // "7", "10", "ubuntu-22.04"
    pub arch:            String,    // "x64", "x86", "arm64", "armv7"
    pub is_arm:          bool,
    pub is_win7:         bool,
    pub is_rpi:          bool,
    pub gpu_vendor:      Option<String>,
}

pub fn get_platform_info() -> PlatformInfo {
    PlatformInfo {
        os:         std::env::consts::OS.to_string(),
        os_version: get_os_version(),
        arch:       std::env::consts::ARCH.to_string(),
        is_arm:     cfg!(any(target_arch = "arm", target_arch = "aarch64")),
        is_win7:    is_windows_7(),
        is_rpi:     is_raspberry_pi(),
        gpu_vendor: get_gpu_vendor(),
    }
}

#[cfg(target_os = "windows")]
pub fn get_os_version() -> String {
    // Usar ntdll.dll para obtener versión real (no la compatibilidad virtual)
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    unsafe {
        let ntdll = winapi::um::libloaderapi::GetModuleHandleW(
            OsStr::new("ntdll.dll\0")
                .encode_wide()
                .collect::<Vec<u16>>()
                .as_ptr()
        );

        if ntdll.is_null() {
            return "unknown".to_string();
        }

        // RtlGetVersion da la versión REAL aunque app esté en modo compatibilidad
        type RtlGetVersion = unsafe extern "system" fn(*mut winapi::um::winnt::OSVERSIONINFOW) -> winapi::shared::ntdef::NTSTATUS;
        let rtl_get_version: RtlGetVersion = std::mem::transmute(
            winapi::um::libloaderapi::GetProcAddress(
                ntdll,
                b"RtlGetVersion\0".as_ptr() as *const _
            )
        );

        let mut osvi: winapi::um::winnt::OSVERSIONINFOW = std::mem::zeroed();
        osvi.dwOSVersionInfoSize = std::mem::size_of::<winapi::um::winnt::OSVERSIONINFOW>() as u32;
        rtl_get_version(&mut osvi);

        match (osvi.dwMajorVersion, osvi.dwMinorVersion) {
            (6, 1) => "7".to_string(),
            (6, 2) => "8".to_string(),
            (6, 3) => "8.1".to_string(),
            (10, 0) if osvi.dwBuildNumber < 22000 => "10".to_string(),
            (10, 0) => "11".to_string(),
            _ => format!("{}.{}", osvi.dwMajorVersion, osvi.dwMinorVersion),
        }
    }
}

#[cfg(target_os = "linux")]
pub fn get_os_version() -> String {
    std::fs::read_to_string("/etc/os-release")
        .unwrap_or_default()
        .lines()
        .find(|l| l.starts_with("PRETTY_NAME="))
        .map(|l| l.trim_start_matches("PRETTY_NAME=").trim_matches('"').to_string())
        .unwrap_or_else(|| "Linux".to_string())
}

#[cfg(target_os = "windows")]
pub fn is_windows_7() -> bool {
    get_os_version() == "7"
}

#[cfg(not(target_os = "windows"))]
pub fn is_windows_7() -> bool { false }

/// Detectar Raspberry Pi por /proc/cpuinfo
#[cfg(target_os = "linux")]
pub fn is_raspberry_pi() -> bool {
    std::fs::read_to_string("/proc/cpuinfo")
        .map(|s| s.contains("Raspberry Pi") || s.contains("BCM27") || s.contains("BCM28"))
        .unwrap_or(false)
}

#[cfg(not(target_os = "linux"))]
pub fn is_raspberry_pi() -> bool { false }

pub fn get_gpu_vendor() -> Option<String> {
    // Usar sysinfo o wgpu para detectar GPU
    None // TODO: implementar con wgpu info
}
```

---

## 2. AUTOBOOT UNIVERSAL (WIN7 + WIN11 + LINUX + RPi)

```rust
// src-tauri/src/core/autoboot_manager.rs
use crate::error::ArcadeError;
use crate::utils::platform::{get_os_version, is_raspberry_pi};
use tracing::info;

pub struct AutobootManager;

impl AutobootManager {
    /// Habilitar autoboot según plataforma
    pub fn enable() -> Result<(), ArcadeError> {
        info!("Enabling autoboot...");

        #[cfg(target_os = "windows")]
        return Self::enable_windows();

        #[cfg(target_os = "linux")]
        return Self::enable_linux();
    }

    pub fn disable() -> Result<(), ArcadeError> {
        #[cfg(target_os = "windows")]
        return Self::disable_windows();

        #[cfg(target_os = "linux")]
        return Self::disable_linux();
    }

    // ── WINDOWS (Registry — funciona Win7 → Win11) ──────────
    #[cfg(target_os = "windows")]
    fn enable_windows() -> Result<(), ArcadeError> {
        use registry::{Hive, Security, Data};

        let exe = std::env::current_exe()
            .map_err(|e| ArcadeError::General(e.to_string()))?
            .to_string_lossy()
            .to_string();

        // HKCU\...\Run funciona en Win7, Win8, Win10, Win11
        Hive::CurrentUser
            .open(r"Software\Microsoft\Windows\CurrentVersion\Run", Security::Write)
            .and_then(|k| k.set_value("ArcadeCore", &Data::String(exe.into())))
            .map_err(|e| ArcadeError::General(format!("Registry error: {}", e)))?;

        info!("Autoboot enabled (Windows Registry)");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn disable_windows() -> Result<(), ArcadeError> {
        use registry::{Hive, Security};

        Hive::CurrentUser
            .open(r"Software\Microsoft\Windows\CurrentVersion\Run", Security::Write)
            .map(|k| { let _ = k.delete_value("ArcadeCore"); })
            .map_err(|e| ArcadeError::General(e.to_string()))?;

        info!("Autoboot disabled (Windows Registry)");
        Ok(())
    }

    // ── LINUX systemd (Ubuntu 18.04+ / Debian 10+) ─────────
    #[cfg(target_os = "linux")]
    fn enable_linux() -> Result<(), ArcadeError> {
        if Self::has_systemd() {
            Self::enable_systemd()
        } else if is_raspberry_pi() {
            Self::enable_rpi_autostart()
        } else {
            Self::enable_rc_local()
        }
    }

    #[cfg(target_os = "linux")]
    fn enable_systemd() -> Result<(), ArcadeError> {
        let exe = std::env::current_exe()?
            .to_string_lossy()
            .to_string();

        let home = dirs::home_dir()
            .ok_or_else(|| ArcadeError::General("No home dir".into()))?;

        let user = std::env::var("USER")
            .or_else(|_| std::env::var("LOGNAME"))
            .unwrap_or_else(|_| "pi".to_string());

        let service_dir = home.join(".config/systemd/user");
        std::fs::create_dir_all(&service_dir)?;

        let service = format!(r#"[Unit]
Description=ArcadeCore Arcade Frontend
After=graphical-session.target

[Service]
Type=simple
ExecStart={exe}
Restart=on-failure
RestartSec=5
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/{user}/.Xauthority

[Install]
WantedBy=graphical-session.target
"#);

        let path = service_dir.join("arcadecore.service");
        std::fs::write(&path, service)?;

        std::process::Command::new("systemctl")
            .args(["--user", "enable", "--now", "arcadecore"])
            .status()?;

        info!("Autoboot enabled (systemd user service)");
        Ok(())
    }

    /// RPi: autostart X11 session
    #[cfg(target_os = "linux")]
    fn enable_rpi_autostart() -> Result<(), ArcadeError> {
        let exe = std::env::current_exe()?.to_string_lossy().to_string();
        let home = dirs::home_dir().unwrap();
        let autostart_dir = home.join(".config/autostart");
        std::fs::create_dir_all(&autostart_dir)?;

        let desktop = format!(r#"[Desktop Entry]
Type=Application
Name=ArcadeCore
Exec={exe}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
"#);
        std::fs::write(autostart_dir.join("arcadecore.desktop"), desktop)?;
        info!("Autoboot enabled (RPi autostart)");
        Ok(())
    }

    /// Fallback: /etc/rc.local (sistemas viejos sin systemd)
    #[cfg(target_os = "linux")]
    fn enable_rc_local() -> Result<(), ArcadeError> {
        let exe = std::env::current_exe()?.to_string_lossy().to_string();
        let marker = "# ArcadeCore autostart";
        let rc = std::fs::read_to_string("/etc/rc.local").unwrap_or_default();

        if !rc.contains(marker) {
            let line = format!("\n{marker}\nDISPLAY=:0 {} &\n", exe);
            // Necesita sudo — notificar al usuario
            tracing::warn!("Cannot write /etc/rc.local without sudo. Add manually: {}", line);
        }
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn has_systemd() -> bool {
        std::path::Path::new("/run/systemd/system").exists()
    }

    #[cfg(target_os = "linux")]
    fn disable_linux() -> Result<(), ArcadeError> {
        if Self::has_systemd() {
            let _ = std::process::Command::new("systemctl")
                .args(["--user", "disable", "--now", "arcadecore"])
                .status();
        }

        let home = dirs::home_dir().unwrap();
        let desktop = home.join(".config/autostart/arcadecore.desktop");
        if desktop.exists() { std::fs::remove_file(desktop)?; }

        info!("Autoboot disabled");
        Ok(())
    }
}
```

---

## 3. KIOSK MODE POR PLATAFORMA

### Windows — Kiosk / Shell Replacement

En Windows, el modo kiosk puede sustituir el Explorer.exe por ArcadeCore:

```rust
// Solo Win10/11 — Group Policy kiosk mode
// Para Win7: usar registry shell replacement
#[cfg(target_os = "windows")]
pub fn set_shell_replacement() -> Result<(), ArcadeError> {
    use registry::{Hive, Security, Data};

    let exe = std::env::current_exe()?.to_string_lossy().to_string();

    // HKCU\Software\Microsoft\Windows NT\CurrentVersion\Winlogon\Shell
    // Reemplaza el shell (Explorer) con ArcadeCore
    // ADVERTENCIA: Esto reemplaza el escritorio de Windows completo
    let key = Hive::CurrentUser
        .create(r"Software\Microsoft\Windows NT\CurrentVersion\Winlogon", Security::Write)
        .map_err(|e| ArcadeError::General(e.to_string()))?;

    key.set_value("Shell", &Data::String(exe.into()))
        .map_err(|e| ArcadeError::General(e.to_string()))?;

    Ok(())
}

// Restaurar Explorer normal
#[cfg(target_os = "windows")]
pub fn restore_shell() -> Result<(), ArcadeError> {
    use registry::{Hive, Security, Data};

    let key = Hive::CurrentUser
        .open(r"Software\Microsoft\Windows NT\CurrentVersion\Winlogon", Security::Write)
        .map_err(|e| ArcadeError::General(e.to_string()))?;

    let _ = key.delete_value("Shell");  // Borra para que use el default (Explorer)
    Ok(())
}
```

### Linux RPi — Lanzar en framebuffer (sin X11)

```bash
# Para RPi con pantalla directa (sin escritorio):
# Editar /etc/rc.local:
/home/pi/arcadecore/arcadecore --kiosk &

# O usar Openbox autostart:
mkdir -p ~/.config/openbox
echo '/home/pi/arcadecore/arcadecore &' >> ~/.config/openbox/autostart

# Ocultar cursor con unclutter:
sudo apt install unclutter
unclutter -idle 0.1 -root &
```

---

## 4. DETECCIÓN DE HARDWARE DISPONIBLE

```rust
// src-tauri/src/commands/system.rs
use crate::utils::platform::*;
use sysinfo::{System, Disks, Networks};

#[tauri::command]
pub async fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let platform = get_platform_info();

    SystemInfo {
        // Platform
        os:          platform.os,
        os_version:  platform.os_version,
        arch:        platform.arch,
        is_arm:      platform.is_arm,
        is_win7:     platform.is_win7,
        is_rpi:      platform.is_rpi,

        // Hardware
        cpu_name:    sys.cpus().first()
                         .map(|c| c.brand().to_string())
                         .unwrap_or_default(),
        cpu_cores:   sys.physical_core_count().unwrap_or(1),
        ram_total_mb: sys.total_memory() / 1024 / 1024,
        ram_free_mb:  sys.available_memory() / 1024 / 1024,

        // Discos
        disks: Disks::new_with_refreshed_list()
            .iter()
            .map(|d| DiskInfo {
                name:        d.name().to_string_lossy().to_string(),
                mount:       d.mount_point().to_string_lossy().to_string(),
                total_gb:    d.total_space() / 1024 / 1024 / 1024,
                free_gb:     d.available_space() / 1024 / 1024 / 1024,
            })
            .collect(),

        // Emuladores disponibles (detección automática)
        emulators_detected: detect_installed_emulators(),
    }
}

#[derive(serde::Serialize)]
pub struct SystemInfo {
    pub os:              String,
    pub os_version:      String,
    pub arch:            String,
    pub is_arm:          bool,
    pub is_win7:         bool,
    pub is_rpi:          bool,
    pub cpu_name:        String,
    pub cpu_cores:       usize,
    pub ram_total_mb:    u64,
    pub ram_free_mb:     u64,
    pub disks:           Vec<DiskInfo>,
    pub emulators_detected: Vec<String>,
}

#[derive(serde::Serialize)]
pub struct DiskInfo {
    pub name:     String,
    pub mount:    String,
    pub total_gb: u64,
    pub free_gb:  u64,
}

/// Detectar emuladores instalados automáticamente
fn detect_installed_emulators() -> Vec<String> {
    let candidates: &[(&str, &str, &str)] = &[
        ("mame",         "mame64",          "mame"),
        ("retroarch",    "retroarch",       "retroarch"),
        ("dolphin",      "Dolphin",         "dolphin-emu"),
        ("duckstation",  "duckstation-qt",  "duckstation-qt"),
        ("pcsx2",        "pcsx2-qt",        "pcsx2-qt"),
        ("ppsspp",       "PPSSPPWindows64", "ppsspp"),
        ("mgba",         "mGBA",            "mgba"),
        ("dosbox",       "dosbox",          "dosbox"),
        ("scummvm",      "scummvm",         "scummvm"),
        ("flycast",      "flycast",         "flycast"),
        ("yuzu",         "yuzu",            "yuzu"),
        ("ryujinx",      "Ryujinx",         "Ryujinx"),
        ("rpcs3",        "rpcs3",           "rpcs3"),
    ];

    candidates.iter()
        .filter(|(_, win_exe, lin_exe)| {
            let name = if cfg!(windows) { win_exe } else { lin_exe };
            which::which(name).is_ok()
        })
        .map(|(id, _, _)| id.to_string())
        .collect()
}
```

---

## 5. NOTAS ESPECIALES POR PLATAFORMA

### Windows 7 — Limitaciones conocidas

```
❌ Yuzu / Ryujinx (Switch): No funcionan en Win7
❌ Vita3K (PS Vita): No funciona en Win7
❌ RPCS3 (PS3): Requiere Windows 8.1+
❌ TeknoParrot (algunos títulos): Requieren DirectX 11.1+ (Win8+)
⚠️ Xenia (Xbox 360): Requiere Windows 8+
⚠️ Cemu (Wii U): Funciona desde Win7 pero con limitaciones gráficas

✅ Todo lo clásico funciona perfecto en Win7:
   MAME, RetroArch, DuckStation, PCSX2, Dolphin, PPSSPP,
   DOSBox, ScummVM, FBNeo, mGBA, Snes9x, Nestopia, etc.
```

### Linux — Consideraciones

```
✅ Mejor compatibilidad que Windows para emuladores modernos
✅ RPCS3 tiene mejor soporte en Linux que Windows
✅ Dolphin es más estable en Linux
⚠️ Algunos emuladores solo tienen binarios Windows (TeknoParrot, Xenia)
⚠️ Requiere configurar permisos udev para controles
```

### ARM / Raspberry Pi — Limitaciones

```
✅ Emuladores de sistemas 8-bit y 16-bit van perfectos
✅ PS1 en RPi 4 va a 60fps con DuckStation
✅ N64 en RPi 4 va bien (la mayoría de juegos)
✅ PSP en RPi 4 va aceptable
⚠️ PS2 (PCSX2) en RPi 4: muy lento
⚠️ GameCube en RPi 4: algunos juegos van, muchos no
❌ PS3, Xbox 360, Switch: No funcionan en ARM
❌ CRT shaders complejos pueden ser lentos en RPi 3
```

---

## 6. CHECKLIST DE COMPATIBILIDAD

### Antes de distribuir tu build

```
Windows 7:
[ ] App compila con target x86_64-pc-windows-msvc
[ ] App compila con target i686-pc-windows-msvc (32-bit)
[ ] Probado en VM Windows 7 SP1 con WebView2
[ ] Autoboot funciona via Registry Run key
[ ] SDL2 detecta controles correctamente
[ ] Emuladores clásicos (MAME, RetroArch, PS1) funcionan
[ ] Emuladores incompatibles (Switch, PS3) muestran mensaje claro

Linux x64:
[ ] App compila sin warnings
[ ] Permisos udev configurados en instalador
[ ] systemd service funciona
[ ] SDL2 detecta controles

ARM / RPi:
[ ] Cross-compile funciona con `cross`
[ ] GPIO feature funciona (si usas monedas GPIO)
[ ] Performance aceptable en el juego más exigente que soportas
[ ] Autostart en X11 o Openbox funciona
```
