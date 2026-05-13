use std::process::Child;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use tracing::{info, warn};

pub struct EmulatorMonitor {
    child_process: Arc<RwLock<Option<Child>>>,
    is_monitoring: Arc<RwLock<bool>>,
}

impl EmulatorMonitor {
    pub fn new() -> Self {
        Self {
            child_process: Arc::new(RwLock::new(None)),
            is_monitoring: Arc::new(RwLock::new(false)),
        }
    }

    /// Set the process to monitor
    pub async fn set_process(&self, child: Child) {
        let mut process = self.child_process.write().await;
        *process = Some(child);
    }

    /// Start monitoring for crashes/exits
    pub async fn start_monitoring(&self, on_exit: impl Fn() + Send + Sync + 'static) {
        let process = self.child_process.clone();
        let is_monitoring = self.is_monitoring.clone();

        // Mark as monitoring
        {
            let mut monitoring = is_monitoring.write().await;
            *monitoring = true;
        }

        // Spawn monitoring task
        tokio::spawn(async move {
            let mut check_interval = interval(Duration::from_millis(500));

            loop {
                check_interval.tick().await;

                // Check if monitoring should continue
                let monitoring = is_monitoring.read().await;
                if !*monitoring {
                    break;
                }
                drop(monitoring);

                // Check process status
                let mut proc = process.write().await;
                if let Some(child) = proc.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            // Process exited
                            info!("Emulator process exited with status: {}", status);
                            *proc = None;

                            // Call exit callback
                            on_exit();

                            // Stop monitoring
                            let mut monitoring = is_monitoring.write().await;
                            *monitoring = false;
                            break;
                        }
                        Ok(None) => {
                            // Still running, continue monitoring
                        }
                        Err(e) => {
                            warn!("Error checking process status: {}", e);
                        }
                    }
                }
            }
        });
    }

    /// Stop monitoring
    pub async fn stop_monitoring(&self) {
        let mut monitoring = self.is_monitoring.write().await;
        *monitoring = false;

        let mut proc = self.child_process.write().await;
        if let Some(mut child) = proc.take() {
            let _ = child.kill();
        }
    }

    /// Check if a process is still running
    pub async fn is_running(&self) -> bool {
        let mut process = self.child_process.write().await;
        if let Some(child) = process.as_mut() {
            // Try a non-blocking wait to check status
            if let Ok(None) = child.try_wait() {
                return true; // Still running
            }
        }
        false
    }

    /// Get process ID if available
    pub async fn get_pid(&self) -> Option<u32> {
        let process = self.child_process.read().await;
        process.as_ref().map(|child| child.id())
    }
}

impl Default for EmulatorMonitor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_monitor_creation() {
        let monitor = EmulatorMonitor::new();
        assert!(!monitor.is_running().await);
    }

    #[tokio::test]
    async fn test_stop_monitoring() {
        let monitor = EmulatorMonitor::new();
        monitor.start_monitoring(|| {}).await;
        monitor.stop_monitoring().await;
        assert!(!monitor.is_running().await);
    }
}
