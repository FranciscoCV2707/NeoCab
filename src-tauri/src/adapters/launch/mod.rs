pub mod strategy;
pub mod chd_mount;
pub mod chd_to_cue;
pub mod zip_extract;
pub mod batch_file;
pub mod shortcut;
pub mod default_rom;

pub use strategy::{LaunchStrategy, LaunchContext, LaunchResult, execute_launch};
pub use chd_mount::ChdMountStrategy;
pub use chd_to_cue::ChdToCueStrategy;
pub use zip_extract::ZipExtractStrategy;
pub use batch_file::BatchFileStrategy;
pub use shortcut::ShortcutStrategy;
pub use default_rom::DefaultRomStrategy;
