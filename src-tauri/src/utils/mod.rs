pub mod platform;
pub mod platform_detect;
pub mod emulator_detector;
pub mod init;
pub mod fuzzy_match;

pub use platform::*;
pub use platform_detect::{detect_mode, RuntimeMode, SystemInfo, get_system_info};
pub use emulator_detector::{EmulatorDetector, EmulatorInfo};
pub use init::{initialize_app_directories, is_first_run, is_portable_mode, get_data_dir, run_startup_validations};
pub use fuzzy_match::{find_best_artwork, jaro_winkler, normalize_name};
