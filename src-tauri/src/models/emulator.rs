use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Emulator {
    pub id: i64,
    pub name: String,
    pub display_name: String,
    pub executable_win: Option<String>,
    pub executable_linux: Option<String>,
    pub executable_arm: Option<String>,
    pub args_template: Option<String>,
    pub extra_args: Option<String>,
    pub min_os_win: Option<String>,
    pub supported_arches: Option<String>,
    pub requires_bios: i64,
    pub version: Option<String>,
    pub enabled: i64,
    pub created_at: Option<String>,
}

impl Emulator {
    /// Get executable for current platform
    pub fn executable(&self) -> Option<&str> {
        #[cfg(target_os = "windows")]
        return self.executable_win.as_deref();

        #[cfg(target_os = "linux")]
        {
            #[cfg(any(target_arch = "arm", target_arch = "aarch64"))]
            if let Some(arm) = self.executable_arm.as_deref() {
                return Some(arm);
            }
            return self.executable_linux.as_deref();
        }

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        None
    }

    /// Check if executable exists on system
    pub fn is_installed(&self) -> bool {
        match self.executable() {
            Some(path) => Path::new(path).exists(),
            None => false,
        }
    }
}
