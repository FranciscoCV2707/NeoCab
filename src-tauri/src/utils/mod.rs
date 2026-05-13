pub mod platform;
pub mod platform_detect;
pub mod emulator_detector;

pub use platform::*;
pub use platform_detect::{detect_mode, RuntimeMode, SystemInfo, get_system_info};
pub use emulator_detector::{EmulatorDetector, EmulatorInfo};
