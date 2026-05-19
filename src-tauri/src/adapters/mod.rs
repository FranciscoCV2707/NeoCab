pub mod config_injectors;
pub mod gambatte_adapter;
pub mod generic_adapter;
pub mod launch;
pub mod mame_adapter;
pub mod mupen64_adapter;
pub mod pcsx_redux_adapter;
pub mod retroarch_adapter;
pub mod trait_adapter;

pub use config_injectors::*;
pub use gambatte_adapter::GambatteAdapter;
pub use generic_adapter::GenericAdapter;
pub use mame_adapter::MameAdapter;
pub use mupen64_adapter::Mupen64Adapter;
pub use pcsx_redux_adapter::PcsxReduxAdapter;
pub use retroarch_adapter::{RetroArchAdapter, RetroArchCore};
pub use trait_adapter::EmulatorAdapter;
