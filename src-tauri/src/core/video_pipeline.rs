use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QualityLevel {
    Ultra,
    High,
    Medium,
    Low,
    Potato,
}

impl QualityLevel {
    pub fn degrade(&self) -> Self {
        match self {
            Self::Ultra => Self::High,
            Self::High => Self::Medium,
            Self::Medium => Self::Low,
            Self::Low => Self::Potato,
            Self::Potato => Self::Potato,
        }
    }

    pub fn upgrade(&self) -> Self {
        match self {
            Self::Ultra => Self::Ultra,
            Self::High => Self::Ultra,
            Self::Medium => Self::High,
            Self::Low => Self::Medium,
            Self::Potato => Self::Low,
        }
    }
}

pub struct VideoPipeline {
    current: QualityLevel,
    #[allow(dead_code)]
    last_fps_check: Instant,
    fps_samples: Vec<f64>,
}

impl Default for VideoPipeline {
    fn default() -> Self {
        Self::new()
    }
}

impl VideoPipeline {
    pub fn new() -> Self {
        Self {
            current: QualityLevel::High,
            last_fps_check: Instant::now(),
            fps_samples: Vec::with_capacity(60),
        }
    }

    pub fn current(&self) -> &QualityLevel {
        &self.current
    }

    pub fn record_frame(&mut self, delta_secs: f64) {
        if delta_secs > 0.0 {
            let fps = 1.0 / delta_secs;
            self.fps_samples.push(fps);
            if self.fps_samples.len() > 60 {
                self.fps_samples.remove(0);
            }
        }
    }

    pub fn avg_fps(&self) -> f64 {
        if self.fps_samples.is_empty() {
            return 60.0;
        }
        self.fps_samples.iter().sum::<f64>() / self.fps_samples.len() as f64
    }

    pub fn adjust_quality(&mut self) -> Option<QualityLevel> {
        let avg = self.avg_fps();
        if avg < 30.0 && self.current != QualityLevel::Potato {
            self.current = self.current.degrade();
            self.fps_samples.clear();
            return Some(self.current.clone());
        } else if avg > 55.0 && self.current != QualityLevel::Ultra {
            self.current = self.current.upgrade();
            self.fps_samples.clear();
            return Some(self.current.clone());
        }
        None
    }

    pub async fn benchmark() -> QualityLevel {
        let cpus = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);

        let total_ram = sysinfo::System::new().total_memory() / 1048576; // MB

        match (cpus, total_ram) {
            (c, _) if c >= 16 => QualityLevel::Ultra,
            (c, r) if c >= 8 && r >= 8192 => QualityLevel::High,
            (c, r) if c >= 4 && r >= 4096 => QualityLevel::Medium,
            (c, _) if c >= 2 => QualityLevel::Low,
            _ => QualityLevel::Potato,
        }
    }
}
