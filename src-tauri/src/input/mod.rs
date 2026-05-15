pub mod sdl_backend;
pub mod gilrs_backend;
pub mod input_manager;
pub mod joy_mapper;
pub mod hotplug;

pub use sdl_backend::SDLBackend;
pub use gilrs_backend::GilrsBackend;
pub use input_manager::{InputManager, InputButton, InputEvent, InputEventType, InputDevice, InputMapping, AxisInput, ProfileAssignment};
pub use joy_mapper::{JoyMapper, JoyProfile, JoyMapping, JoyTrigger, MappedAction, MacroStep, ArcadeAction, ResponseCurve, DeadzoneConfig, DeadzoneType, TriggerRange, StickDelayConfig, MappingSet, KeyInjector, StubInjector};
