#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(feature = "modern-ui")]
    {
        let args: Vec<String> = std::env::args().collect();
        let kiosk_config = neocab_lib::parse_cli_args(&args);
        neocab_lib::run_with_config(kiosk_config)
    }

    #[cfg(all(feature = "legacy-ui", not(feature = "modern-ui")))]
    {
        let args: Vec<String> = std::env::args().collect();
        let kiosk_config = neocab_lib::parse_cli_args(&args);
        neocab_lib::run_with_config(kiosk_config)
    }

    #[cfg(not(any(feature = "modern-ui", feature = "legacy-ui")))]
    {
        eprintln!("No UI mode selected. Enable 'modern-ui' or 'legacy-ui' feature");
        std::process::exit(1);
    }
}
