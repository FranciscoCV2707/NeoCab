pub mod trait_adapter;
pub mod mame_adapter;
pub mod retroarch_adapter;

pub use trait_adapter::EmulatorAdapter;
pub use mame_adapter::MameAdapter;
pub use retroarch_adapter::{RetroArchAdapter, RetroArchCore};
