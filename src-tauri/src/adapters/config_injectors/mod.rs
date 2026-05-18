pub mod dolphin_injector;
pub mod duckstation_injector;
pub mod injector_trait;
pub mod mame_injector;
pub mod pcsx2_injector;
pub mod registry;
pub mod retroarch_injector;
pub mod xenia_injector;

pub use dolphin_injector::DolphinInjector;
pub use duckstation_injector::DuckStationInjector;
pub use injector_trait::{EmulatorConfigInjector, EmulatorSettings};
pub use mame_injector::MameInjector;
pub use pcsx2_injector::Pcsx2Injector;
pub use registry::{find_injector, get_all_injectors, list_injectors};
pub use retroarch_injector::RetroArchInjector;
pub use xenia_injector::XeniaInjector;
