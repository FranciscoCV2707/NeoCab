pub mod emulator_detector;
pub mod fuzzy_match;
pub mod init;
pub mod platform;
pub mod platform_detect;

pub use emulator_detector::{EmulatorDetector, EmulatorInfo};
pub use fuzzy_match::{find_best_artwork, jaro_winkler, normalize_name};
pub use init::{
    get_data_dir, initialize_app_directories, is_first_run, is_portable_mode,
    run_startup_validations,
};
pub use platform::*;
pub use platform_detect::{detect_mode, get_system_info, RuntimeMode, SystemInfo};
