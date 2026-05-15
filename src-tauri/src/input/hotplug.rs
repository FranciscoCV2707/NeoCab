use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tracing::info;

/// Hotplug detection for gamepad devices.
/// Uses polling of device list and emits events on connect/disconnect.
pub struct HotplugDetector {
    known_devices: Arc<std::sync::Mutex<HashSet<String>>>,
    running: Arc<AtomicBool>,
}

impl HotplugDetector {
    pub fn new() -> Self {
        Self {
            known_devices: Arc::new(std::sync::Mutex::new(HashSet::new())),
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start(&self, on_connect: impl Fn(&str) + Send + 'static, on_disconnect: impl Fn(&str) + Send + 'static) {
        let known = self.known_devices.clone();
        let running = self.running.clone();
        running.store(true, Ordering::Relaxed);

        std::thread::spawn(move || {
            while running.load(Ordering::Relaxed) {
                let current = enumerate_devices();

                let mut known_set = known.lock().unwrap();

                // Detect new devices
                for device in &current {
                    if !known_set.contains(device) {
                        info!("Gamepad connected: {}", device);
                        on_connect(device);
                    }
                }

                // Detect removed devices
                let removed: Vec<String> = known_set.iter()
                    .filter(|d| !current.contains(d.as_str()))
                    .cloned()
                    .collect();
                for device in &removed {
                    info!("Gamepad disconnected: {}", device);
                    on_disconnect(device);
                }

                *known_set = current.into_iter().collect();

                std::thread::sleep(std::time::Duration::from_secs(2));
            }
        });
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }
}

fn enumerate_devices() -> HashSet<String> {
    let mut devices = HashSet::new();

    // Use SDL GameControllerDB names if available
    // Fallback: check common device paths
    #[cfg(windows)]
    {
        // Check DirectInput devices via registry or WinAPI
        if let Ok(entries) = std::fs::read_dir("C:\\Windows\\System32") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("game") || name.contains("joystick") {
                    devices.insert(name);
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(entries) = std::fs::read_dir("/dev/input") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("js") {
                    devices.insert(format!("/dev/input/{}", name));
                }
            }
        }
    }

    devices
}
