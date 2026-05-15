mod github;
mod download;
mod extract;

use std::env;
use std::process;
use std::path::Path;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: neocab-updater --check");
        eprintln!("       neocab-updater --apply <zip_path> <current_exe> [parent_pid]");
        process::exit(1);
    }

    match args[1].as_str() {
        "--check" => {
            match github::check_for_updates() {
                Ok(info) => {
                    println!("{}", serde_json::to_string(&info).unwrap());
                }
                Err(e) => {
                    eprintln!("Check failed: {}", e);
                    process::exit(1);
                }
            }
        }
        "--apply" => {
            if args.len() < 4 {
                eprintln!("Usage: neocab-updater --apply <zip_path> <current_exe> [parent_pid]");
                process::exit(1);
            }
            let zip_path = &args[2];
            let exe_path = &args[3];
            let parent_pid: u32 = args.get(4)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);

            if parent_pid > 0 {
                wait_for_parent(parent_pid);
            }

            match apply_update(zip_path, exe_path) {
                Ok(()) => {
                    println!("Update applied. Restarting...");
                }
                Err(e) => {
                    eprintln!("Apply failed: {}", e);
                    process::exit(1);
                }
            }
        }
        _ => {
            eprintln!("Unknown command: {}", args[1]);
            process::exit(1);
        }
    }
}

#[cfg(windows)]
fn wait_for_parent(pid: u32) {
    use winapi::um::processthreadsapi::OpenProcess;
    use winapi::um::processthreadsapi::GetExitCodeProcess;
    use winapi::um::winnt::PROCESS_QUERY_INFORMATION;
    use winapi::um::handleapi::CloseHandle;
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_INFORMATION, 0, pid);
        if !handle.is_null() {
            loop {
                let mut exit_code: u32 = 0;
                if GetExitCodeProcess(handle, &mut exit_code) == 0 {
                    break;
                }
                if exit_code != 259 {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
            CloseHandle(handle);
        }
    }
}

#[cfg(not(windows))]
fn wait_for_parent(pid: u32) {
    loop {
        let status = std::process::Command::new("kill")
            .arg("-0")
            .arg(pid.to_string())
            .status();
        match status {
            Ok(s) if s.success() => {
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
            _ => break,
        }
    }
}

fn apply_update(zip_path: &str, exe_path: &str) -> Result<(), String> {
    let install_dir = Path::new(exe_path)
        .parent()
        .ok_or_else(|| "Cannot determine install directory".to_string())?;

    println!("Extracting {} to {}", zip_path, install_dir.display());

    extract::extract_zip(zip_path, install_dir)?;

    println!("Update applied successfully");
    Ok(())
}
