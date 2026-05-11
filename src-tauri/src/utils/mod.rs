pub mod platform;
pub mod platform_detect;

pub use platform::*;
pub use platform_detect::{detect_mode, RuntimeMode, SystemInfo, get_system_info};
