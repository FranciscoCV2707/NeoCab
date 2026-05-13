use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use crate::error::{NeoCabError, Result};
use crate::core::coin_manager::CoinEvent;

/// GPIO Coin Detection for Raspberry Pi
/// Monitors GPIO pin for coin pulses and converts to coin events
#[cfg(target_os = "linux")]
pub struct GPIOCoinDetector {
    gpio_pin: u32,
    debounce_ms: u32,
    pulse_threshold_ms: u32,
    coin_channel: mpsc::UnboundedSender<CoinEvent>,
    is_running: Arc<std::sync::atomic::AtomicBool>,
}

#[cfg(not(target_os = "linux"))]
pub struct GPIOCoinDetector;

#[cfg(target_os = "linux")]
impl GPIOCoinDetector {
    pub fn new(
        gpio_pin: u32,
        coin_channel: mpsc::UnboundedSender<CoinEvent>,
    ) -> Self {
        Self {
            gpio_pin,
            debounce_ms: 20,    // Debounce duration
            pulse_threshold_ms: 100, // Minimum pulse hold time
            coin_channel,
            is_running: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }

    /// Start monitoring GPIO pin for coin pulses
    pub async fn start_monitoring(&self) -> Result<()> {
        tracing::info!("Starting GPIO coin detection on pin {}", self.gpio_pin);

        self.is_running
            .store(true, std::sync::atomic::Ordering::SeqCst);

        // GPIO monitoring would be implemented with rppal crate for RPi
        // Example implementation structure:
        // let gpio = Gpio::new()?;
        // let pin = gpio.get(self.gpio_pin)?
        //     .into_input(PullMode::Pull Down);
        // while self.is_running.load(...) {
        //     if pin.is_high() {
        //         self.handle_pulse().await?;
        //     }
        //     tokio::time::sleep(Duration::from_millis(10)).await;
        // }

        Ok(())
    }

    /// Stop monitoring GPIO pin
    pub fn stop_monitoring(&self) {
        tracing::info!("Stopping GPIO coin detection");
        self.is_running
            .store(false, std::sync::atomic::Ordering::SeqCst);
    }

    /// Handle coin pulse detection
    pub async fn handle_pulse(&self) -> Result<()> {
        tracing::debug!("Coin pulse detected on GPIO pin {}", self.gpio_pin);

        // Send coin event to the channel
        let event = CoinEvent::Inserted {
            timestamp: chrono::Utc::now(),
            gpio_pin: Some(self.gpio_pin),
        };

        self.coin_channel.send(event).map_err(|e| {
            NeoCabError::System(format!("Failed to send coin event: {}", e))
        })?;

        Ok(())
    }

    /// Configure GPIO parameters
    pub fn configure(&mut self, debounce_ms: u32, pulse_threshold_ms: u32) {
        self.debounce_ms = debounce_ms.max(10).min(100);
        self.pulse_threshold_ms = pulse_threshold_ms.max(50).min(500);
        tracing::info!(
            "GPIO configured - debounce: {}ms, threshold: {}ms",
            self.debounce_ms,
            self.pulse_threshold_ms
        );
    }

    /// Test GPIO connection
    pub async fn test_gpio(&self) -> Result<()> {
        tracing::info!("Testing GPIO connection on pin {}", self.gpio_pin);

        // GPIO test would check if pin is accessible and responds to input
        // with rppal: attempt to read pin state

        Ok(())
    }

    pub fn get_gpio_pin(&self) -> u32 {
        self.gpio_pin
    }

    pub fn is_active(&self) -> bool {
        self.is_running.load(std::sync::atomic::Ordering::SeqCst)
    }
}

#[cfg(not(target_os = "linux"))]
impl GPIOCoinDetector {
    pub fn new(_gpio_pin: u32, _coin_channel: mpsc::UnboundedSender<CoinEvent>) -> Self {
        Self
    }

    pub async fn start_monitoring(&self) -> Result<()> {
        Err(NeoCabError::System(
            "GPIO coin detection only available on Linux".to_string(),
        ))
    }

    pub fn stop_monitoring(&self) {
        tracing::warn!("GPIO not available on this platform");
    }

    pub async fn handle_pulse(&self) -> Result<()> {
        Err(NeoCabError::System(
            "GPIO not available on this platform".to_string(),
        ))
    }

    pub fn configure(&mut self, _debounce_ms: u32, _pulse_threshold_ms: u32) {
        tracing::warn!("GPIO configuration not available on this platform");
    }

    pub async fn test_gpio(&self) -> Result<()> {
        Err(NeoCabError::System(
            "GPIO test only available on Linux".to_string(),
        ))
    }

    pub fn get_gpio_pin(&self) -> u32 {
        0
    }

    pub fn is_active(&self) -> bool {
        false
    }
}

/// GPIO Configuration for arcade hardware
#[derive(Debug, Clone)]
pub struct GPIOConfig {
    pub enabled: bool,
    pub gpio_pin: u32,
    pub debounce_ms: u32,
    pub pulse_threshold_ms: u32,
}

impl Default for GPIOConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            gpio_pin: 4,  // BCM GPIO 4 (default RPi pin)
            debounce_ms: 20,
            pulse_threshold_ms: 100,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_os = "linux")]
    fn test_gpio_config_defaults() {
        let config = GPIOConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.gpio_pin, 4);
        assert_eq!(config.debounce_ms, 20);
    }

    #[test]
    fn test_gpio_config_custom() {
        let config = GPIOConfig {
            enabled: true,
            gpio_pin: 17,
            debounce_ms: 30,
            pulse_threshold_ms: 150,
        };
        assert!(config.enabled);
        assert_eq!(config.gpio_pin, 17);
    }
}
