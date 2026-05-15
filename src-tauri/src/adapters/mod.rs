pub mod trait_adapter;
pub mod mame_adapter;
pub mod retroarch_adapter;
pub mod pcsx_redux_adapter;
pub mod mupen64_adapter;
pub mod gambatte_adapter;
pub mod launch;
pub mod config_injectors;

pub use trait_adapter::EmulatorAdapter;
pub use mame_adapter::MameAdapter;
pub use retroarch_adapter::{RetroArchAdapter, RetroArchCore};
pub use pcsx_redux_adapter::PcsxReduxAdapter;
pub use mupen64_adapter::Mupen64Adapter;
pub use gambatte_adapter::GambatteAdapter;
pub use config_injectors::*;
