use crate::error::{NeoCabError, Result};

/// Arduino Serial Interface for arcade hardware control
/// Communicates with Arduino for coin counting and solenoid triggering
pub struct ArduinoInterface {
    #[cfg(feature = "hardware-arduino")]
    port: Option<Box<dyn serialport::SerialPort>>,
    #[cfg(not(feature = "hardware-arduino"))]
    port: Option<()>,
    port_name: String,
    #[allow(dead_code)]
    baud_rate: u32,
    is_connected: bool,
}

impl ArduinoInterface {
    /// Create new Arduino interface
    pub fn new(port_name: String, baud_rate: u32) -> Self {
        Self {
            port: None,
            port_name,
            baud_rate,
            is_connected: false,
        }
    }

    /// Connect to Arduino via serial port
    #[cfg(feature = "hardware-arduino")]
    pub fn connect(&mut self) -> Result<()> {
        use std::time::Duration;

        tracing::info!(
            "Connecting to Arduino on {} at {} baud",
            self.port_name,
            self.baud_rate
        );

        match serialport::new(&self.port_name, self.baud_rate)
            .timeout(Duration::from_secs(10))
            .open()
        {
            Ok(port) => {
                self.port = Some(Box::new(port));
                self.is_connected = true;
                tracing::info!("Arduino connected successfully");
                Ok(())
            }
            Err(e) => {
                let error_msg = format!("Failed to connect to Arduino: {}", e);
                tracing::error!("{}", error_msg);
                Err(NeoCabError::System(error_msg))
            }
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn connect(&mut self) -> Result<()> {
        tracing::warn!("Arduino feature not enabled - using mock connection");
        self.is_connected = true;
        Ok(())
    }

    /// Disconnect from Arduino
    pub fn disconnect(&mut self) -> Result<()> {
        tracing::info!("Disconnecting from Arduino");
        self.port = None;
        self.is_connected = false;
        Ok(())
    }

    /// Detect coin from Arduino counter
    /// Sends request to Arduino and reads coin count
    #[cfg(feature = "hardware-arduino")]
    pub fn detect_coins(&mut self) -> Result<u32> {
        if !self.is_connected {
            return Err(NeoCabError::System("Arduino not connected".to_string()));
        }

        if let Some(port) = &mut self.port {
            // Send request: 'C' = read coin count
            port.write_all(b"C").map_err(|e| {
                NeoCabError::System(format!("Failed to send command to Arduino: {}", e))
            })?;

            // Read response: 4 bytes (u32 little-endian)
            let mut buffer = [0u8; 4];
            port.read_exact(&mut buffer)
                .map_err(|e| NeoCabError::System(format!("Failed to read from Arduino: {}", e)))?;

            let coin_count = u32::from_le_bytes(buffer);
            tracing::debug!("Coin count from Arduino: {}", coin_count);

            Ok(coin_count)
        } else {
            Err(NeoCabError::System(
                "Serial port not initialized".to_string(),
            ))
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn detect_coins(&mut self) -> Result<u32> {
        tracing::debug!("Mock coin detection (Arduino feature disabled)");
        Ok(0)
    }

    /// Trigger solenoid (simulated button press on arcade cabinet)
    /// Used for prize/ticket dispensing or credit activation
    #[cfg(feature = "hardware-arduino")]
    pub fn trigger_solenoid(&mut self, output_id: u8) -> Result<()> {
        if !self.is_connected {
            return Err(NeoCabError::System("Arduino not connected".to_string()));
        }

        if let Some(port) = &mut self.port {
            // Send command: 'S' (solenoid) + output ID
            let command = [b'S', output_id];
            port.write_all(&command)
                .map_err(|e| NeoCabError::System(format!("Failed to trigger solenoid: {}", e)))?;

            tracing::info!("Solenoid {} triggered", output_id);
            Ok(())
        } else {
            Err(NeoCabError::System(
                "Serial port not initialized".to_string(),
            ))
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn trigger_solenoid(&mut self, output_id: u8) -> Result<()> {
        tracing::debug!(
            "Mock solenoid trigger (Arduino feature disabled): {}",
            output_id
        );
        Ok(())
    }

    /// Test connection and communication with Arduino
    pub fn test_connection(&mut self) -> Result<bool> {
        tracing::info!("Testing Arduino connection");

        #[cfg(feature = "hardware-arduino")]
        {
            if let Some(port) = &mut self.port {
                // Send ping: 'P'
                port.write_all(b"P")
                    .map_err(|e| NeoCabError::System(format!("Failed to send ping: {}", e)))?;

                // Read pong response: 'O'
                let mut buffer = [0u8; 1];
                port.read_exact(&mut buffer)
                    .map_err(|e| NeoCabError::System(format!("No pong response: {}", e)))?;

                let success = buffer[0] == b'O';
                tracing::info!("Arduino test {}", if success { "passed" } else { "failed" });
                Ok(success)
            } else {
                Err(NeoCabError::System(
                    "Serial port not initialized".to_string(),
                ))
            }
        }

        #[cfg(not(feature = "hardware-arduino"))]
        {
            tracing::debug!("Mock Arduino test (Arduino feature disabled)");
            Ok(true)
        }
    }

    /// Get list of available serial ports
    #[cfg(feature = "hardware-arduino")]
    pub fn list_ports() -> Result<Vec<String>> {
        match serialport::available_ports() {
            Ok(ports) => {
                let port_names: Vec<String> = ports
                    .iter()
                    .filter_map(|p| match p {
                        serialport::SerialPortInfo {
                            port_name,
                            port_type: _,
                        } => Some(port_name.clone()),
                    })
                    .collect();

                tracing::info!("Available ports: {:?}", port_names);
                Ok(port_names)
            }
            Err(e) => {
                let error_msg = format!("Failed to list serial ports: {}", e);
                tracing::error!("{}", error_msg);
                Err(NeoCabError::System(error_msg))
            }
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn list_ports() -> Result<Vec<String>> {
        tracing::debug!("Mock port listing (Arduino feature disabled)");
        Ok(vec!["COM3".to_string(), "COM4".to_string()])
    }

    /// Set LED state and color
    #[cfg(feature = "hardware-arduino")]
    pub fn set_led(&mut self, pin: u8, color_hex: Option<&str>, state: bool) -> Result<()> {
        use std::io::Write;
        if !self.is_connected {
            return Err(NeoCabError::System("Arduino not connected".to_string()));
        }
        if let Some(port) = &mut self.port {
            let state_byte = if state { b'1' } else { b'0' };
            let color = color_hex.unwrap_or("FFFFFF");
            let cmd = format!("L{:02x}{}{}\n", pin, state_byte as char, color);
            port.write_all(cmd.as_bytes()).map_err(|e| {
                NeoCabError::System(format!("Failed to write LED command: {}", e))
            })?;
            tracing::info!("Arduino SetLED command sent: {}", cmd.trim());
            Ok(())
        } else {
            Err(NeoCabError::System("Serial port not initialized".to_string()))
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn set_led(&mut self, pin: u8, color_hex: Option<&str>, state: bool) -> Result<()> {
        tracing::debug!("Mock SetLED (Arduino disabled): pin={}, color={:?}, state={}", pin, color_hex, state);
        Ok(())
    }

    /// Blink LED
    #[cfg(feature = "hardware-arduino")]
    pub fn blink_led(&mut self, pin: u8, times: u32, interval_ms: u32) -> Result<()> {
        use std::io::Write;
        if !self.is_connected {
            return Err(NeoCabError::System("Arduino not connected".to_string()));
        }
        if let Some(port) = &mut self.port {
            let cmd = format!("B{:02x}{:04x}{:04x}\n", pin, times, interval_ms);
            port.write_all(cmd.as_bytes()).map_err(|e| {
                NeoCabError::System(format!("Failed to write BlinkLED command: {}", e))
            })?;
            tracing::info!("Arduino BlinkLED command sent: {}", cmd.trim());
            Ok(())
        } else {
            Err(NeoCabError::System("Serial port not initialized".to_string()))
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn blink_led(&mut self, pin: u8, times: u32, _interval_ms: u32) -> Result<()> {
        tracing::debug!("Mock BlinkLED (Arduino disabled): pin={}, times={}", pin, times);
        Ok(())
    }

    /// Play sound on Arduino buzzer
    #[cfg(feature = "hardware-arduino")]
    pub fn play_sound(&mut self, sound_id: u8) -> Result<()> {
        use std::io::Write;
        if !self.is_connected {
            return Err(NeoCabError::System("Arduino not connected".to_string()));
        }
        if let Some(port) = &mut self.port {
            let cmd = format!("P{:02x}\n", sound_id);
            port.write_all(cmd.as_bytes()).map_err(|e| {
                NeoCabError::System(format!("Failed to write PlaySound command: {}", e))
            })?;
            tracing::info!("Arduino PlaySound command sent: {}", cmd.trim());
            Ok(())
        } else {
            Err(NeoCabError::System("Serial port not initialized".to_string()))
        }
    }

    #[cfg(not(feature = "hardware-arduino"))]
    pub fn play_sound(&mut self, sound_id: u8) -> Result<()> {
        tracing::debug!("Mock PlaySound (Arduino disabled): sound_id={}", sound_id);
        Ok(())
    }


    pub fn is_connected(&self) -> bool {
        self.is_connected
    }

    pub fn get_port_name(&self) -> &str {
        &self.port_name
    }
}

/// Arduino Configuration for arcade hardware
#[derive(Debug, Clone)]
pub struct ArduinoConfig {
    pub enabled: bool,
    pub port_name: String,
    pub baud_rate: u32,
    pub coin_multiplier: u32,
    pub solenoid_pins: Vec<u8>,
}

impl Default for ArduinoConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            #[cfg(target_os = "windows")]
            port_name: "COM3".to_string(),
            #[cfg(target_os = "linux")]
            port_name: "/dev/ttyUSB0".to_string(),
            #[cfg(target_os = "macos")]
            port_name: "/dev/tty.usbserial-1410".to_string(),
            baud_rate: 9600,
            coin_multiplier: 1,
            solenoid_pins: vec![2, 3, 4, 5], // Arduino digital pins
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_arduino_config_default() {
        let config = ArduinoConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.baud_rate, 9600);
        assert_eq!(config.coin_multiplier, 1);
    }

    #[test]
    fn test_arduino_interface_creation() {
        let interface = ArduinoInterface::new("COM3".to_string(), 9600);
        assert!(!interface.is_connected);
        assert_eq!(interface.get_port_name(), "COM3");
    }
}
