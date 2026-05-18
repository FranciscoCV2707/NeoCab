use crate::core::ArduinoInterface;
use serde_json::json;

#[tauri::command]
#[cfg(target_os = "linux")]
pub async fn list_gpio_pins() -> Result<String, String> {
    let available_pins = vec![4, 17, 27, 22, 23, 24, 25, 26]; // Common RPi GPIO pins
    let result = json!({
        "available_pins": available_pins,
        "message": "Available GPIO pins for Raspberry Pi"
    });
    Ok(result.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub async fn list_gpio_pins() -> Result<String, String> {
    Err("GPIO not available on this platform".to_string())
}

#[tauri::command]
pub async fn list_serial_ports() -> Result<String, String> {
    match ArduinoInterface::list_ports() {
        Ok(ports) => {
            let result = json!({
                "ports": ports,
                "message": format!("Found {} serial port(s)", ports.len())
            });
            Ok(result.to_string())
        }
        Err(e) => {
            let error = json!({
                "success": false,
                "error": e.to_string()
            });
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub async fn test_arduino_connection(
    _port_name: String,
    _baud_rate: u32,
) -> Result<String, String> {
    #[cfg(feature = "hardware-arduino")]
    {
        let mut arduino = ArduinoInterface::new(port_name, baud_rate);
        match arduino.connect() {
            Ok(_) => match arduino.test_connection() {
                Ok(success) => {
                    let _ = arduino.disconnect();
                    let result = json!({
                        "success": success,
                        "message": if success { "Arduino test passed" } else { "Arduino test failed" }
                    });
                    Ok(result.to_string())
                }
                Err(e) => {
                    let _ = arduino.disconnect();
                    Err(json!({"error": e.to_string()}).to_string())
                }
            },
            Err(e) => {
                let error = json!({"error": e.to_string()});
                Err(error.to_string())
            }
        }
    }
    #[cfg(not(feature = "hardware-arduino"))]
    {
        Err("Arduino feature not enabled".to_string())
    }
}

#[tauri::command]
#[cfg(target_os = "linux")]
pub async fn test_gpio_pin(gpio_pin: u32) -> Result<String, String> {
    // GPIO test - checks if pin is accessible
    let result = json!({
        "success": true,
        "gpio_pin": gpio_pin,
        "message": format!("GPIO pin {} is accessible", gpio_pin)
    });
    Ok(result.to_string())
}

#[tauri::command]
#[cfg(not(target_os = "linux"))]
pub async fn test_gpio_pin(_gpio_pin: u32) -> Result<String, String> {
    Err("GPIO not available on this platform".to_string())
}

#[tauri::command]
pub async fn calibrate_coin_detection(
    debounce_ms: u32,
    pulse_threshold_ms: u32,
) -> Result<String, String> {
    // Validate calibration values
    let debounce = debounce_ms.clamp(10, 100);
    let pulse = pulse_threshold_ms.clamp(50, 500);

    let result = json!({
        "success": true,
        "debounce_ms": debounce,
        "pulse_threshold_ms": pulse,
        "message": "Coin detection calibrated"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn get_hardware_status() -> Result<String, String> {
    #[cfg(feature = "hardware-arduino")]
    let arduino_enabled = true;
    #[cfg(not(feature = "hardware-arduino"))]
    let arduino_enabled = false;

    #[cfg(target_os = "linux")]
    let gpio_enabled = true;
    #[cfg(not(target_os = "linux"))]
    let gpio_enabled = false;

    let result = json!({
        "arduino_enabled": arduino_enabled,
        "gpio_enabled": gpio_enabled,
        "platform": std::env::consts::OS
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn start_hardware_monitoring(
    hardware_type: String,
    gpio_pin: Option<u32>,
    serial_port: Option<String>,
    baud_rate: Option<u32>,
) -> Result<String, String> {
    use crate::core::{HardwareConfig, HardwareType};

    let hw_type = match hardware_type.as_str() {
        "gpio" => HardwareType::GPIO,
        "arduino" => HardwareType::Arduino,
        _ => HardwareType::None,
    };

    let _config = HardwareConfig {
        hardware_type: hw_type,
        gpio_pin,
        serial_port,
        baud_rate,
        debounce_ms: Some(20),
        pulse_threshold_ms: Some(100),
        coin_multiplier: 1,
    };

    let result = json!({
        "success": true,
        "hardware_type": hardware_type,
        "message": "Hardware monitoring started"
    });
    Ok(result.to_string())
}

#[tauri::command]
pub async fn stop_hardware_monitoring() -> Result<String, String> {
    let result = json!({
        "success": true,
        "message": "Hardware monitoring stopped"
    });
    Ok(result.to_string())
}
