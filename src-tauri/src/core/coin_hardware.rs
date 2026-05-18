use crate::core::CoinManager;
use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, error, info};

/// Hardware integration for coin detection and management
/// Supports GPIO (RPi) and Arduino serial communication

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HardwareType {
    None,
    GPIO,
    Arduino,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareConfig {
    pub hardware_type: HardwareType,
    pub gpio_pin: Option<u32>,
    pub serial_port: Option<String>,
    pub baud_rate: Option<u32>,
    pub debounce_ms: Option<u32>,
    pub pulse_threshold_ms: Option<u32>,
    pub coin_multiplier: u32,
}

impl Default for HardwareConfig {
    fn default() -> Self {
        Self {
            hardware_type: HardwareType::None,
            gpio_pin: None,
            serial_port: None,
            baud_rate: Some(9600),
            debounce_ms: Some(20),
            pulse_threshold_ms: Some(100),
            coin_multiplier: 1,
        }
    }
}

/// Extension trait for CoinManager to support hardware integration
pub trait CoinHardwareExt {
    fn start_hardware_monitoring(&mut self, config: HardwareConfig) -> Result<()>;
    fn stop_hardware_monitoring(&mut self) -> Result<()>;
    fn handle_coin_pulse(&self) -> Result<()>;
}

impl CoinHardwareExt for CoinManager {
    /// Start monitoring hardware for coin detection
    fn start_hardware_monitoring(&mut self, config: HardwareConfig) -> Result<()> {
        match config.hardware_type {
            HardwareType::None => {
                info!("Hardware monitoring disabled");
                Ok(())
            }
            #[cfg(target_os = "linux")]
            HardwareType::GPIO => {
                info!(
                    "Starting GPIO monitoring on pin {}",
                    config.gpio_pin.unwrap_or(4)
                );
                // GPIO monitoring would be started here
                // In actual implementation, spawn async task
                Ok(())
            }
            #[cfg(not(target_os = "linux"))]
            HardwareType::GPIO => {
                error!("GPIO monitoring only available on Linux");
                Err(crate::error::NeoCabError::System(
                    "GPIO not supported on this platform".to_string(),
                ))
            }
            #[cfg(feature = "hardware-arduino")]
            HardwareType::Arduino => {
                info!(
                    "Starting Arduino monitoring on port: {}",
                    config
                        .serial_port
                        .as_ref()
                        .unwrap_or(&"Unknown".to_string())
                );
                // Arduino monitoring would be started here
                // In actual implementation, spawn polling task
                Ok(())
            }
            #[cfg(not(feature = "hardware-arduino"))]
            HardwareType::Arduino => {
                error!("Arduino support not enabled");
                Err(crate::error::NeoCabError::System(
                    "Arduino feature not compiled".to_string(),
                ))
            }
        }
    }

    /// Stop hardware monitoring
    fn stop_hardware_monitoring(&mut self) -> Result<()> {
        info!("Stopping hardware monitoring");
        Ok(())
    }

    /// Handle coin pulse from hardware
    fn handle_coin_pulse(&self) -> Result<()> {
        debug!("Coin pulse detected from hardware");
        // This would be called by the hardware monitoring task
        // when a coin pulse is detected
        Ok(())
    }
}

/// Hardware monitoring task context
pub struct HardwareMonitor {
    pub config: HardwareConfig,
    pub coin_tx: mpsc::UnboundedSender<u32>,
    pub is_running: Arc<std::sync::atomic::AtomicBool>,
}

impl HardwareMonitor {
    pub fn new(config: HardwareConfig, coin_tx: mpsc::UnboundedSender<u32>) -> Self {
        Self {
            config,
            coin_tx,
            is_running: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }

    /// Spawn async monitoring task (GPIO implementation)
    #[cfg(target_os = "linux")]
    pub async fn start_gpio_monitoring(&self) -> Result<()> {
        let pin = self.config.gpio_pin.ok_or_else(|| {
            crate::error::NeoCabError::System("GPIO pin not configured".to_string())
        })?;

        let debounce = self.config.debounce_ms.unwrap_or(20);
        let threshold = self.config.pulse_threshold_ms.unwrap_or(100);
        let multiplier = self.config.coin_multiplier;
        let tx = self.coin_tx.clone();
        let running = self.is_running.clone();

        running.store(true, std::sync::atomic::Ordering::SeqCst);

        info!(
            "GPIO monitoring started: pin={}, debounce={}ms, threshold={}ms",
            pin, debounce, threshold
        );

        // In production, this would use rppal or libgpiod
        // For now, return placeholder
        Ok(())
    }

    /// Spawn async monitoring task (Arduino implementation)
    #[cfg(feature = "hardware-arduino")]
    pub async fn start_arduino_monitoring(&self) -> Result<()> {
        let port = self.config.serial_port.clone().ok_or_else(|| {
            crate::error::NeoCabError::System("Serial port not configured".to_string())
        })?;

        let baud = self.config.baud_rate.unwrap_or(9600);
        let multiplier = self.config.coin_multiplier;
        let tx = self.coin_tx.clone();
        let running = self.is_running.clone();

        running.store(true, std::sync::atomic::Ordering::SeqCst);

        info!("Arduino monitoring started: port={}, baud={}", port, baud);

        // In production, this would open serial port and poll for 'C' commands
        // For now, return placeholder
        Ok(())
    }

    /// Stop monitoring
    pub fn stop(&self) {
        info!("Stopping hardware monitoring");
        self.is_running
            .store(false, std::sync::atomic::Ordering::SeqCst);
    }

    /// Check if monitoring is active
    pub fn is_active(&self) -> bool {
        self.is_running.load(std::sync::atomic::Ordering::SeqCst)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_config_default() {
        let config = HardwareConfig::default();
        assert!(matches!(config.hardware_type, HardwareType::None));
        assert_eq!(config.coin_multiplier, 1);
        assert_eq!(config.baud_rate, Some(9600));
    }

    #[test]
    fn test_hardware_monitor_creation() {
        let (tx, _rx) = mpsc::unbounded_channel();
        let config = HardwareConfig::default();
        let monitor = HardwareMonitor::new(config, tx);
        assert!(!monitor.is_active());
    }

    #[test]
    fn test_gpio_config() {
        let config = HardwareConfig {
            hardware_type: HardwareType::GPIO,
            gpio_pin: Some(17),
            debounce_ms: Some(30),
            pulse_threshold_ms: Some(150),
            ..Default::default()
        };
        assert!(matches!(config.hardware_type, HardwareType::GPIO));
        assert_eq!(config.gpio_pin, Some(17));
    }

    #[test]
    fn test_arduino_config() {
        let config = HardwareConfig {
            hardware_type: HardwareType::Arduino,
            serial_port: Some("COM3".to_string()),
            baud_rate: Some(115200),
            coin_multiplier: 5,
            ..Default::default()
        };
        assert!(matches!(config.hardware_type, HardwareType::Arduino));
        assert_eq!(config.serial_port, Some("COM3".to_string()));
    }
}
