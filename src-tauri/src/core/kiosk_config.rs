#[derive(Debug, Clone)]
pub struct KioskConfig {
    pub kiosk: bool,
    pub autoboot_system: Option<String>,
    pub autoboot_delay: u64,
    pub disable_settings: bool,
    pub disable_shutdown: bool,
    pub disable_reboot: bool,
    pub disable_appclose: bool,
    pub disable_suspend: bool,
}

impl Default for KioskConfig {
    fn default() -> Self {
        Self {
            kiosk: false,
            autoboot_system: None,
            autoboot_delay: 5,
            disable_settings: false,
            disable_shutdown: false,
            disable_reboot: false,
            disable_appclose: false,
            disable_suspend: false,
        }
    }
}

pub fn parse_cli_args(args: &[String]) -> KioskConfig {
    let mut config = KioskConfig::default();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--kiosk" => config.kiosk = true,
            "--autoboot" => {
                i += 1;
                if i < args.len() {
                    config.autoboot_system = Some(args[i].clone());
                }
            }
            "--autoboot-delay" => {
                i += 1;
                if i < args.len() {
                    config.autoboot_delay = args[i].parse().unwrap_or(5);
                }
            }
            "--disable-menu-settings" => config.disable_settings = true,
            "--disable-menu-shutdown" => config.disable_shutdown = true,
            "--disable-menu-reboot" => config.disable_reboot = true,
            "--disable-menu-appclose" => config.disable_appclose = true,
            "--disable-menu-suspend" => config.disable_suspend = true,
            _ => {}
        }
        i += 1;
    }
    config
}
