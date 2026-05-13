use std::env;

fn main() {
    tauri_build::build();

    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();

    // Compile-time feature logging
    println!("cargo:warning=Building NeoCab for {} ({})", target_os, target_arch);

    #[cfg(feature = "modern-ui")]
    println!("cargo:warning=Feature: modern-ui (Tauri + React + WebView2)");

    #[cfg(feature = "legacy-ui")]
    println!("cargo:warning=Feature: legacy-ui (SDL2 + OpenGL for Windows XP)");

    #[cfg(feature = "hardware-gpio")]
    println!("cargo:warning=Feature: hardware-gpio (Raspberry Pi coin detection)");

    #[cfg(feature = "hardware-arduino")]
    println!("cargo:warning=Feature: hardware-arduino (Arduino serial interface)");

    #[cfg(feature = "platform-detection")]
    println!("cargo:warning=Feature: platform-detection (Auto-detect Windows version)");

    // Windows XP subsystem flag (i686-pc-windows-msvc only)
    if target_os == "windows" && target_arch == "x86" {
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS,5.01");
    }

    // Linux ARM optimization
    if target_os == "linux" && (target_arch == "arm" || target_arch == "aarch64") {
        println!("cargo:rustc-env=CARGO_CFG_TARGET_ARM=1");
    }
}
