use super::dolphin_injector::DolphinInjector;
use super::duckstation_injector::DuckStationInjector;
use super::injector_trait::EmulatorConfigInjector;
use super::mame_injector::MameInjector;
use super::pcsx2_injector::Pcsx2Injector;
use super::retroarch_injector::RetroArchInjector;
use super::xenia_injector::XeniaInjector;

/// Registry of all config injectors, ordered by priority
pub fn get_all_injectors() -> Vec<Box<dyn EmulatorConfigInjector>> {
    vec![
        Box::new(MameInjector),
        Box::new(RetroArchInjector),
        Box::new(DolphinInjector),
        Box::new(Pcsx2Injector),
        Box::new(DuckStationInjector),
        Box::new(XeniaInjector),
    ]
}

/// Find a matching injector for the given emulator path
pub fn find_injector(emulator_path: &str) -> Option<Box<dyn EmulatorConfigInjector>> {
    get_all_injectors()
        .into_iter()
        .find(|inj| inj.can_handle(emulator_path))
}

/// Get all registered injector names
pub fn list_injectors() -> Vec<(String, String)> {
    get_all_injectors()
        .into_iter()
        .map(|inj| (inj.name().to_string(), inj.display_name().to_string()))
        .collect()
}
