use std::env;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuntimeMode {
    /// Tauri + React + WebView2 (Windows 7+, Linux, ARM)
    Modern,
    /// SDL2 + OpenGL (Windows XP SP2+)
    Legacy,
}

impl std::fmt::Display for RuntimeMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RuntimeMode::Modern => write!(f, "Modern (Tauri+React)"),
            RuntimeMode::Legacy => write!(f, "Legacy (SDL2)"),
        }
    }
}

/// Auto-detect runtime mode based on platform and environment
pub fn detect_mode() -> RuntimeMode {
    let os = env::consts::OS;
    let arch = env::consts::ARCH;

    tracing::info!("Platform detection: OS={}, ARCH={}", os, arch);

    match os {
        "windows" => detect_windows_mode(arch),
        "linux" | "macos" => RuntimeMode::Modern,
        _ => {
            tracing::warn!("Unknown OS detected, defaulting to Modern mode");
            RuntimeMode::Modern
        }
    }
}

#[cfg(target_os = "windows")]
fn detect_windows_mode(_arch: &str) -> RuntimeMode {
    // Check Windows version
    let version = get_windows_version();
    tracing::debug!("Windows version: {:?}", version);

    // Windows XP = version 5.1 or 5.2
    if version.major <= 5 {
        if has_webview2() {
            tracing::info!("Windows XP detected with WebView2 fallback - using Modern mode");
            RuntimeMode::Modern
        } else {
            tracing::info!("Windows XP detected without WebView2 - using Legacy mode (SDL2)");
            RuntimeMode::Legacy
        }
    } else if version.major >= 6 {
        // Windows Vista, 7, 8, 10, 11 (version 6.0+)
        if has_webview2() {
            tracing::info!(
                "Windows {} detected with WebView2 - using Modern mode",
                version.major
            );
            RuntimeMode::Modern
        } else {
            tracing::warn!(
                "Windows {} detected WITHOUT WebView2 - falling back to Legacy mode",
                version.major
            );
            RuntimeMode::Legacy
        }
    } else {
        tracing::warn!("Could not determine Windows version, defaulting to Modern");
        RuntimeMode::Modern
    }
}

#[cfg(not(target_os = "windows"))]
fn detect_windows_mode(_arch: &str) -> RuntimeMode {
    RuntimeMode::Modern
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct WindowsVersion {
    major: u32,
    minor: u32,
    build: u32,
}

#[cfg(target_os = "windows")]
fn get_windows_version() -> WindowsVersion {
    use winreg::enums::HKEY_LOCAL_MACHINE;
    use winreg::RegKey;

    match RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion")
    {
        Ok(key) => {
            let major: String = key
                .get_value("CurrentMajorVersionNumber")
                .unwrap_or_else(|_| {
                    // Fallback to CurrentVersion string
                    key.get_value("CurrentVersion")
                        .unwrap_or_else(|_| "10".to_string())
                });

            let minor: String = key
                .get_value("CurrentMinorVersionNumber")
                .unwrap_or_else(|_| "0".to_string());

            let build: String = key
                .get_value("CurrentBuildNumber")
                .unwrap_or_else(|_| "0".to_string());

            WindowsVersion {
                major: major.parse().unwrap_or(10),
                minor: minor.parse().unwrap_or(0),
                build: build.parse().unwrap_or(0),
            }
        }
        Err(e) => {
            tracing::warn!("Failed to read Windows version from registry: {}", e);
            WindowsVersion {
                major: 10,
                minor: 0,
                build: 0,
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_windows_version() -> WindowsVersion {
    WindowsVersion {
        major: 10,
        minor: 0,
        build: 0,
    }
}

#[cfg(target_os = "windows")]
fn has_webview2() -> bool {
    use winreg::enums::HKEY_LOCAL_MACHINE;
    use winreg::RegKey;

    // Check for WebView2 registry entries
    let paths = vec![
        "SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        "SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
    ];

    for path in paths {
        if RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(path).is_ok() {
            tracing::debug!("WebView2 detected at registry path: {}", path);
            return true;
        }
    }

    // Also try checking for WebView2 installation directory
    let appdata = std::env::var("LOCALAPPDATA").ok();
    if let Some(appdata_path) = appdata {
        let webview_path =
            std::path::PathBuf::from(appdata_path).join("Microsoft\\EdgeWebView\\Application");
        if webview_path.exists() {
            tracing::debug!("WebView2 detected at filesystem path: {:?}", webview_path);
            return true;
        }
    }

    tracing::debug!("WebView2 NOT detected");
    false
}

#[cfg(not(target_os = "windows"))]
fn has_webview2() -> bool {
    // WebView2 is Windows-only, always "installed" on non-Windows (use platform native renderers)
    true
}

/// Get system information for logging and debugging
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        family: env::consts::FAMILY.to_string(),
    }
}

#[derive(Debug, Clone)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub family: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_mode_non_windows() {
        // This test runs on whatever platform we're on
        let mode = detect_mode();
        assert!(matches!(mode, RuntimeMode::Modern | RuntimeMode::Legacy));
    }

    #[test]
    fn test_runtime_mode_display() {
        assert_eq!(RuntimeMode::Modern.to_string(), "Modern (Tauri+React)");
        assert_eq!(RuntimeMode::Legacy.to_string(), "Legacy (SDL2)");
    }
}
