pub mod batch_file;
pub mod chd_mount;
pub mod chd_to_cue;
pub mod default_rom;
pub mod shortcut;
pub mod strategy;
pub mod zip_extract;

pub use batch_file::BatchFileStrategy;
pub use chd_mount::ChdMountStrategy;
pub use chd_to_cue::ChdToCueStrategy;
pub use default_rom::DefaultRomStrategy;
pub use shortcut::ShortcutStrategy;
pub use strategy::{execute_launch, LaunchContext, LaunchResult, LaunchStrategy};
pub use zip_extract::ZipExtractStrategy;
