// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(feature = "modern-ui")]
    {
        // Modern mode: Tauri + React + WebView2
        neocab_lib::run()
    }

    #[cfg(all(feature = "legacy-ui", not(feature = "modern-ui")))]
    {
        // Legacy mode: SDL2 + OpenGL (Windows XP)
        #[cfg(target_os = "windows")]
        {
            eprintln!("Legacy SDL2 mode not yet implemented for Windows XP");
            std::process::exit(1);
        }

        #[cfg(not(target_os = "windows"))]
        {
            eprintln!("Legacy SDL2 mode is Windows-only");
            std::process::exit(1);
        }
    }

    #[cfg(not(any(feature = "modern-ui", feature = "legacy-ui")))]
    {
        eprintln!("No UI mode selected. Enable 'modern-ui' or 'legacy-ui' feature");
        std::process::exit(1);
    }
}
