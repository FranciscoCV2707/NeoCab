use crate::error::Result;
use std::process::Command;
use tracing::info;

pub struct AutobootManager {
    app_name: String,
    app_path: String,
    kiosk_mode: bool,
}

impl AutobootManager {
    pub fn new(app_name: String, app_path: String) -> Self {
        Self {
            app_name,
            app_path,
            kiosk_mode: false,
        }
    }

    #[cfg(target_os = "windows")]
    pub fn enable_autoboot(&self) -> Result<()> {
        let reg_path = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        let value_name = &self.app_name;
        let exe_path = self.app_path.replace("\\", "\\\\");

        let output = Command::new("reg")
            .args(["add", reg_path, "/v", value_name, "/d", &exe_path, "/f"])
            .output()?;

        if output.status.success() {
            info!("Autoboot enabled for {}", self.app_name);
            Ok(())
        } else {
            Err(crate::error::NeoCabError::InvalidInput(format!(
                "Failed to enable autoboot: {:?}",
                String::from_utf8_lossy(&output.stderr)
            )))
        }
    }

    #[cfg(not(target_os = "windows"))]
    pub fn enable_autoboot(&self) -> Result<()> {
        #[cfg(target_os = "linux")]
        {
            let desktop_entry = format!(
                "[Desktop Entry]\nType=Application\nName={}\nExec={}\nAutostart=true\nX-GNOME-Autostart-enabled=true",
                self.app_name, self.app_path
            );

            let autostart_dir = dirs::config_dir()
                .ok_or_else(|| {
                    crate::error::NeoCabError::InvalidInput("Config dir not found".to_string())
                })?
                .join("autostart");

            std::fs::create_dir_all(&autostart_dir)?;
            std::fs::write(
                autostart_dir.join(format!("{}.desktop", self.app_name)),
                desktop_entry,
            )?;

            info!("Autoboot enabled for {} on Linux", self.app_name);
            Ok(())
        }
        #[cfg(not(target_os = "linux"))]
        {
            Err(crate::error::NeoCabError::InvalidInput(
                "Autoboot not supported on this platform".to_string(),
            ))
        }
    }

    #[cfg(target_os = "windows")]
    pub fn disable_autoboot(&self) -> Result<()> {
        let reg_path = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        let value_name = &self.app_name;

        let output = Command::new("reg")
            .args(["delete", reg_path, "/v", value_name, "/f"])
            .output()?;

        if output.status.success() {
            info!("Autoboot disabled for {}", self.app_name);
            Ok(())
        } else {
            Err(crate::error::NeoCabError::InvalidInput(format!(
                "Failed to disable autoboot: {:?}",
                String::from_utf8_lossy(&output.stderr)
            )))
        }
    }

    #[cfg(not(target_os = "windows"))]
    pub fn disable_autoboot(&self) -> Result<()> {
        #[cfg(target_os = "linux")]
        {
            let autostart_dir = dirs::config_dir()
                .ok_or_else(|| {
                    crate::error::NeoCabError::InvalidInput("Config dir not found".to_string())
                })?
                .join("autostart");

            let file_path = autostart_dir.join(format!("{}.desktop", self.app_name));
            if file_path.exists() {
                std::fs::remove_file(file_path)?;
            }

            info!("Autoboot disabled for {} on Linux", self.app_name);
            Ok(())
        }
        #[cfg(not(target_os = "linux"))]
        {
            Err(crate::error::NeoCabError::InvalidInput(
                "Autoboot not supported on this platform".to_string(),
            ))
        }
    }

    #[cfg(target_os = "windows")]
    pub fn is_autoboot_enabled(&self) -> Result<bool> {
        let reg_path = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        let value_name = &self.app_name;

        let output = Command::new("reg")
            .args(["query", reg_path, "/v", value_name])
            .output()?;

        Ok(output.status.success())
    }

    #[cfg(not(target_os = "windows"))]
    pub fn is_autoboot_enabled(&self) -> Result<bool> {
        #[cfg(target_os = "linux")]
        {
            let autostart_dir = dirs::config_dir()
                .ok_or_else(|| {
                    crate::error::NeoCabError::InvalidInput("Config dir not found".to_string())
                })?
                .join("autostart");

            let file_path = autostart_dir.join(format!("{}.desktop", self.app_name));
            Ok(file_path.exists())
        }
        #[cfg(not(target_os = "linux"))]
        {
            Ok(false)
        }
    }

    pub fn enable_kiosk_mode(&mut self) -> Result<()> {
        self.kiosk_mode = true;
        info!("Kiosk mode enabled");
        Ok(())
    }

    pub fn disable_kiosk_mode(&mut self) -> Result<()> {
        self.kiosk_mode = false;
        info!("Kiosk mode disabled");
        Ok(())
    }

    pub fn is_kiosk_mode_enabled(&self) -> bool {
        self.kiosk_mode
    }
}

impl Default for AutobootManager {
    fn default() -> Self {
        Self {
            app_name: "NeoCab".to_string(),
            app_path: std::env::current_exe()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            kiosk_mode: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_autoboot_manager_creation() {
        let manager = AutobootManager::new("TestApp".to_string(), "/path/to/app".to_string());
        assert!(!manager.is_kiosk_mode_enabled());
    }

    #[test]
    fn test_kiosk_mode_toggle() {
        let mut manager = AutobootManager::new("TestApp".to_string(), "/path/to/app".to_string());

        let _ = manager.enable_kiosk_mode();
        assert!(manager.is_kiosk_mode_enabled());

        let _ = manager.disable_kiosk_mode();
        assert!(!manager.is_kiosk_mode_enabled());
    }
}
