pub fn get_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "unknown"
    }
}

#[cfg(target_os = "windows")]
pub fn raise_process_priority(pid: u32) {
    use winapi::um::processthreadsapi::{GetCurrentProcess, OpenProcess, SetPriorityClass};
    use winapi::um::winbase::{HIGH_PRIORITY_CLASS, BELOW_NORMAL_PRIORITY_CLASS};
    use winapi::um::winnt::PROCESS_SET_INFORMATION;
    use winapi::um::handleapi::CloseHandle;

    unsafe {
        // Lower NeoCab's own priority so it doesn't steal CPU time from the game
        let current_proc = GetCurrentProcess();
        SetPriorityClass(current_proc, BELOW_NORMAL_PRIORITY_CLASS);

        // Open the emulator process and raise its priority
        let proc_handle = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
        if !proc_handle.is_null() {
            if SetPriorityClass(proc_handle, HIGH_PRIORITY_CLASS) == 0 {
                tracing::warn!("Failed to set emulator process priority to HIGH");
            } else {
                tracing::info!("Successfully set emulator process (PID {}) priority to HIGH", pid);
            }
            CloseHandle(proc_handle);
        }
    }
}

#[cfg(target_os = "windows")]
pub fn restore_own_priority() {
    use winapi::um::processthreadsapi::{GetCurrentProcess, SetPriorityClass};
    use winapi::um::winbase::NORMAL_PRIORITY_CLASS;

    unsafe {
        let current_proc = GetCurrentProcess();
        let _ = SetPriorityClass(current_proc, NORMAL_PRIORITY_CLASS);
        tracing::info!("Restored NeoCab process priority to NORMAL");
    }
}

#[cfg(not(target_os = "windows"))]
pub fn raise_process_priority(_pid: u32) {}

#[cfg(not(target_os = "windows"))]
pub fn restore_own_priority() {}

#[cfg(target_os = "windows")]
#[link(name = "winmm")]
extern "system" {
    fn timeBeginPeriod(period: u32) -> u32;
    fn timeEndPeriod(period: u32) -> u32;
}

#[cfg(target_os = "windows")]
pub fn enable_high_precision_timer() {
    unsafe {
        if timeBeginPeriod(1) == 0 {
            tracing::info!("Successfully set Windows timer resolution to 1ms");
        } else {
            tracing::warn!("Failed to set Windows timer resolution");
        }
    }
}

#[cfg(target_os = "windows")]
pub fn disable_high_precision_timer() {
    unsafe {
        let _ = timeEndPeriod(1);
        tracing::info!("Restored Windows timer resolution");
    }
}

#[cfg(not(target_os = "windows"))]
pub fn enable_high_precision_timer() {}

#[cfg(not(target_os = "windows"))]
pub fn disable_high_precision_timer() {}

