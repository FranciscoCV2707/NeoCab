use crate::error::{NeoCabError, Result};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shader {
    pub name: String,
    pub description: String,
    pub path: PathBuf,
    pub shader_type: ShaderType,
    pub parameters: Vec<ShaderParameter>,
    pub is_valid: bool,
    pub validation_errors: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ShaderType {
    CRT,
    Scanlines,
    Blur,
    Phosphor,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderParameter {
    pub name: String,
    pub display_name: String,
    pub param_type: String,
    pub min_value: f32,
    pub max_value: f32,
    pub default_value: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderPreset {
    pub name: String,
    pub shader: String,
    pub parameters: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderValidation {
    pub valid: bool,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShaderScanStats {
    pub total_shaders: usize,
    pub custom_shaders: usize,
    pub invalid_shaders: usize,
    pub scan_duration_ms: u64,
    pub custom_shaders_path: PathBuf,
}

pub struct ShaderManager {
    shaders_path: PathBuf,
    custom_shaders_path: PathBuf,
    active_parameters: RwLock<HashMap<String, f32>>,
    shader_watcher: RwLock<Option<RecommendedWatcher>>,
    shader_cache: Arc<RwLock<Option<Vec<Shader>>>>,
    scan_stats_cache: Arc<RwLock<Option<ShaderScanStats>>>,
}

impl ShaderManager {
    pub fn new(shaders_path: PathBuf) -> Self {
        Self {
            shaders_path,
            custom_shaders_path: PathBuf::from("./config/shaders"),
            active_parameters: RwLock::new(Self::default_parameters()),
            shader_watcher: RwLock::new(None),
            shader_cache: Arc::new(RwLock::new(None)),
            scan_stats_cache: Arc::new(RwLock::new(None)),
        }
    }

    pub fn with_custom_path(shaders_path: PathBuf, custom_shaders_path: PathBuf) -> Self {
        Self {
            shaders_path,
            custom_shaders_path,
            active_parameters: RwLock::new(Self::default_parameters()),
            shader_watcher: RwLock::new(None),
            shader_cache: Arc::new(RwLock::new(None)),
            scan_stats_cache: Arc::new(RwLock::new(None)),
        }
    }

    fn default_parameters() -> HashMap<String, f32> {
        [
            ("CRTgamma".to_string(), 2.2),
            ("monitorgamma".to_string(), 2.2),
            ("d".to_string(), 1.5),
            ("scanline_strength".to_string(), 0.75),
            ("scanline_thickness".to_string(), 1.0),
            ("phosphor_strength".to_string(), 0.5),
            ("brightness".to_string(), 1.0),
            ("contrast".to_string(), 1.0),
            ("phosphor_decay".to_string(), 0.35),
        ]
        .into_iter()
        .collect()
    }

    fn advanced_parameters() -> Vec<ShaderParameter> {
        vec![
            ShaderParameter {
                name: "brightness".to_string(),
                display_name: "Brightness".to_string(),
                param_type: "float".to_string(),
                min_value: 0.5,
                max_value: 2.0,
                default_value: 1.0,
            },
            ShaderParameter {
                name: "contrast".to_string(),
                display_name: "Contrast".to_string(),
                param_type: "float".to_string(),
                min_value: 0.5,
                max_value: 2.0,
                default_value: 1.0,
            },
            ShaderParameter {
                name: "phosphor_decay".to_string(),
                display_name: "Phosphor Decay".to_string(),
                param_type: "float".to_string(),
                min_value: 0.0,
                max_value: 1.0,
                default_value: 0.35,
            },
        ]
    }

    fn all_parameters(&self) -> Vec<ShaderParameter> {
        let mut parameters = Vec::new();
        for shader in [
            self.get_default_crt_shader(),
            self.get_scanlines_shader(),
            self.get_phosphor_shader(),
        ] {
            parameters.extend(shader.parameters);
        }
        parameters.extend(Self::advanced_parameters());
        parameters
    }

    fn display_name_from_uniform(name: &str) -> String {
        name.split('_')
            .filter(|part| !part.is_empty())
            .map(|part| {
                let mut chars = part.chars();
                match chars.next() {
                    Some(first) => format!("{}{}", first.to_uppercase(), chars.as_str()),
                    None => String::new(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn parameter_for_uniform(&self, name: &str) -> ShaderParameter {
        self.all_parameters()
            .into_iter()
            .find(|param| param.name == name)
            .unwrap_or_else(|| ShaderParameter {
                name: name.to_string(),
                display_name: Self::display_name_from_uniform(name),
                param_type: "float".to_string(),
                min_value: 0.0,
                max_value: 1.0,
                default_value: 0.5,
            })
    }

    fn parse_uniform_parameters(&self, source: &str) -> Vec<ShaderParameter> {
        let mut parameters = Vec::new();

        for line in source.lines() {
            let line = line.split("//").next().unwrap_or("").trim();
            let line = line.strip_suffix(';').unwrap_or(line).trim();
            let parts: Vec<_> = line.split_whitespace().collect();

            if parts.len() < 3 || parts[0] != "uniform" {
                continue;
            }

            if !matches!(parts[1], "float" | "int") {
                continue;
            }

            let name = parts[2].split(['[', '=']).next().unwrap_or(parts[2]).trim();

            if name.is_empty()
                || name == "tex"
                || name == "texture"
                || parameters
                    .iter()
                    .any(|param: &ShaderParameter| param.name == name)
            {
                continue;
            }

            parameters.push(self.parameter_for_uniform(name));
        }

        if parameters.is_empty() {
            Self::advanced_parameters()
        } else {
            parameters
        }
    }

    fn is_shader_change_event(event: &Event) -> bool {
        let is_file_change = matches!(
            event.kind,
            EventKind::Any | EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
        );

        is_file_change
            && event
                .paths
                .iter()
                .any(|path| path.extension().map_or(false, |ext| ext == "glsl"))
    }

    /// Get default CRT shader
    pub fn get_default_crt_shader(&self) -> Shader {
        Shader {
            name: "CRT - Geom".to_string(),
            description: "Realistic CRT monitor with geometry distortion".to_string(),
            path: self.shaders_path.join("crt-geom.glsl"),
            shader_type: ShaderType::CRT,
            parameters: vec![
                ShaderParameter {
                    name: "CRTgamma".to_string(),
                    display_name: "CRT Gamma".to_string(),
                    param_type: "float".to_string(),
                    min_value: 1.0,
                    max_value: 3.0,
                    default_value: 2.2,
                },
                ShaderParameter {
                    name: "monitorgamma".to_string(),
                    display_name: "Monitor Gamma".to_string(),
                    param_type: "float".to_string(),
                    min_value: 1.0,
                    max_value: 3.0,
                    default_value: 2.2,
                },
                ShaderParameter {
                    name: "d".to_string(),
                    display_name: "Distance".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.0,
                    max_value: 3.0,
                    default_value: 1.5,
                },
            ],
            is_valid: true,
            validation_errors: Vec::new(),
        }
    }

    /// Get scanlines shader
    pub fn get_scanlines_shader(&self) -> Shader {
        Shader {
            name: "Scanlines".to_string(),
            description: "Classic horizontal scanlines effect".to_string(),
            path: self.shaders_path.join("scanlines.glsl"),
            shader_type: ShaderType::Scanlines,
            parameters: vec![
                ShaderParameter {
                    name: "scanline_strength".to_string(),
                    display_name: "Scanline Strength".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.0,
                    max_value: 1.0,
                    default_value: 0.75,
                },
                ShaderParameter {
                    name: "scanline_thickness".to_string(),
                    display_name: "Scanline Thickness".to_string(),
                    param_type: "float".to_string(),
                    min_value: 0.5,
                    max_value: 2.0,
                    default_value: 1.0,
                },
            ],
            is_valid: true,
            validation_errors: Vec::new(),
        }
    }

    /// Get phosphor shader
    pub fn get_phosphor_shader(&self) -> Shader {
        Shader {
            name: "Phosphor".to_string(),
            description: "Phosphor dot matrix effect (shadow mask)".to_string(),
            path: self.shaders_path.join("phosphor.glsl"),
            shader_type: ShaderType::Phosphor,
            parameters: vec![ShaderParameter {
                name: "phosphor_strength".to_string(),
                display_name: "Phosphor Strength".to_string(),
                param_type: "float".to_string(),
                min_value: 0.0,
                max_value: 1.0,
                default_value: 0.5,
            }],
            is_valid: true,
            validation_errors: Vec::new(),
        }
    }

    fn validate_shader_source(source: &str) -> ShaderValidation {
        let mut errors = Vec::new();
        let trimmed = source.trim();

        if trimmed.is_empty() {
            errors.push("Line 1: Shader source is empty".to_string());
        }

        if !source.lines().any(|line| line.contains("void main")) {
            errors.push("Line 1: Shader must define void main".to_string());
        }

        if !source
            .lines()
            .any(|line| line.contains("gl_FragColor") || line.contains("fragColor"))
        {
            errors.push("Line 1: Shader must write a fragment color".to_string());
        }

        let mut brace_depth = 0i32;
        let mut opening_lines = Vec::new();
        for (line_index, line) in source.lines().enumerate() {
            let line_number = line_index + 1;
            for ch in line.chars() {
                match ch {
                    '{' => {
                        brace_depth += 1;
                        opening_lines.push(line_number);
                    }
                    '}' => {
                        brace_depth -= 1;
                        if opening_lines.pop().is_none() || brace_depth < 0 {
                            errors.push(format!(
                                "Line {}: Shader has unmatched closing brace",
                                line_number
                            ));
                            brace_depth = 0;
                            break;
                        }
                    }
                    _ => {}
                }
            }
        }

        if let Some(line_number) = opening_lines.pop() {
            errors.push(format!(
                "Line {}: Shader has unmatched opening brace",
                line_number
            ));
        }

        ShaderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    async fn custom_shader_from_path(&self, path: PathBuf) -> Result<Shader> {
        let name = path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("custom")
            .to_string();
        let source = fs::read_to_string(&path).await?;
        let validation = Self::validate_shader_source(&source);
        let parameters = self.parse_uniform_parameters(&source);

        Ok(Shader {
            name: format!("Custom - {}", name),
            description: format!("Custom GLSL shader: {}", name),
            path,
            shader_type: ShaderType::Custom,
            parameters,
            is_valid: validation.valid,
            validation_errors: validation.errors,
        })
    }

    async fn scan_shaders(&self) -> Result<Vec<Shader>> {
        let mut shaders = vec![
            self.get_default_crt_shader(),
            self.get_scanlines_shader(),
            self.get_phosphor_shader(),
        ];

        fs::create_dir_all(&self.custom_shaders_path).await?;

        if self.custom_shaders_path.exists() {
            let mut custom_paths = Vec::new();
            let mut entries = fs::read_dir(&self.custom_shaders_path).await?;
            while let Some(entry) = entries.next_entry().await? {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "glsl") {
                    custom_paths.push(path);
                }
            }

            custom_paths.sort();
            for path in custom_paths {
                shaders.push(self.custom_shader_from_path(path).await?);
            }
        }

        Ok(shaders)
    }

    async fn scan_shaders_with_stats(&self) -> Result<(Vec<Shader>, ShaderScanStats)> {
        let start = Instant::now();
        let shaders = self.scan_shaders().await?;
        let custom_shaders = shaders
            .iter()
            .filter(|shader| shader.shader_type == ShaderType::Custom)
            .count();
        let invalid_shaders = shaders.iter().filter(|shader| !shader.is_valid).count();
        let stats = ShaderScanStats {
            total_shaders: shaders.len(),
            custom_shaders,
            invalid_shaders,
            scan_duration_ms: start.elapsed().as_millis() as u64,
            custom_shaders_path: self.custom_shaders_path.clone(),
        };

        Ok((shaders, stats))
    }

    fn cached_shaders(&self) -> Result<Option<Vec<Shader>>> {
        let cache = self
            .shader_cache
            .read()
            .map_err(|_| NeoCabError::InvalidInput("Shader cache lock poisoned".to_string()))?;

        Ok(cache.clone())
    }

    fn store_shader_cache(
        &self,
        shaders: Vec<Shader>,
        stats: ShaderScanStats,
    ) -> Result<Vec<Shader>> {
        {
            let mut cache = self
                .shader_cache
                .write()
                .map_err(|_| NeoCabError::InvalidInput("Shader cache lock poisoned".to_string()))?;
            *cache = Some(shaders.clone());
        }

        let mut stats_cache = self.scan_stats_cache.write().map_err(|_| {
            NeoCabError::InvalidInput("Shader scan stats lock poisoned".to_string())
        })?;
        *stats_cache = Some(stats);

        Ok(shaders)
    }

    pub fn last_scan_stats(&self) -> Result<Option<ShaderScanStats>> {
        let stats_cache = self.scan_stats_cache.read().map_err(|_| {
            NeoCabError::InvalidInput("Shader scan stats lock poisoned".to_string())
        })?;

        Ok(stats_cache.clone())
    }

    fn invalidate_shader_cache(
        cache: &Arc<RwLock<Option<Vec<Shader>>>>,
        stats_cache: &Arc<RwLock<Option<ShaderScanStats>>>,
    ) {
        match cache.write() {
            Ok(mut shader_cache) => {
                *shader_cache = None;
            }
            Err(_) => tracing::warn!("Shader cache lock poisoned while invalidating cache"),
        }

        match stats_cache.write() {
            Ok(mut shader_stats_cache) => {
                *shader_stats_cache = None;
            }
            Err(_) => tracing::warn!("Shader scan stats lock poisoned while invalidating cache"),
        }
    }

    /// List all available shaders
    pub async fn list_shaders(&self) -> Result<Vec<Shader>> {
        if let Some(shaders) = self.cached_shaders()? {
            return Ok(shaders);
        }

        let (shaders, stats) = self.scan_shaders_with_stats().await?;
        self.store_shader_cache(shaders, stats)
    }

    /// Rescan shader directories and return profiling data for UI/performance diagnostics.
    pub async fn rescan_shaders(&self) -> Result<(Vec<Shader>, ShaderScanStats)> {
        let (shaders, stats) = self.scan_shaders_with_stats().await?;
        self.store_shader_cache(shaders.clone(), stats.clone())?;

        Ok((shaders, stats))
    }

    pub fn start_shader_watcher<F>(&self, mut on_change: F) -> Result<bool>
    where
        F: FnMut() + Send + 'static,
    {
        let mut watcher_guard = self
            .shader_watcher
            .write()
            .map_err(|_| NeoCabError::InvalidInput("Shader watcher lock poisoned".to_string()))?;

        if watcher_guard.is_some() {
            return Ok(false);
        }

        std::fs::create_dir_all(&self.custom_shaders_path)?;

        let watch_path = self.custom_shaders_path.clone();
        let shader_cache = Arc::clone(&self.shader_cache);
        let scan_stats_cache = Arc::clone(&self.scan_stats_cache);
        let mut watcher = RecommendedWatcher::new(
            move |event_result| match event_result {
                Ok(event) if Self::is_shader_change_event(&event) => {
                    Self::invalidate_shader_cache(&shader_cache, &scan_stats_cache);
                    on_change();
                }
                Ok(_) => {}
                Err(error) => tracing::warn!("Shader watcher error: {}", error),
            },
            Config::default(),
        )
        .map_err(|error| {
            NeoCabError::System(format!("Failed to start shader watcher: {}", error))
        })?;

        watcher
            .watch(&watch_path, RecursiveMode::NonRecursive)
            .map_err(|error| {
                NeoCabError::System(format!("Failed to watch shaders path: {}", error))
            })?;

        *watcher_guard = Some(watcher);
        Ok(true)
    }

    pub fn stop_shader_watcher(&self) -> Result<bool> {
        let mut watcher_guard = self
            .shader_watcher
            .write()
            .map_err(|_| NeoCabError::InvalidInput("Shader watcher lock poisoned".to_string()))?;

        Ok(watcher_guard.take().is_some())
    }

    pub fn is_shader_watcher_running(&self) -> Result<bool> {
        let watcher_guard = self
            .shader_watcher
            .read()
            .map_err(|_| NeoCabError::InvalidInput("Shader watcher lock poisoned".to_string()))?;

        Ok(watcher_guard.is_some())
    }

    /// Get shader by name
    pub async fn get_shader(&self, name: &str) -> Result<Option<Shader>> {
        let shaders = self.list_shaders().await?;
        match shaders.into_iter().find(|s| s.name == name) {
            Some(shader) if shader.is_valid => Ok(Some(shader)),
            Some(shader) => Err(NeoCabError::InvalidInput(format!(
                "Shader {} is invalid: {}",
                shader.name,
                shader.validation_errors.join(", ")
            ))),
            None => Ok(None),
        }
    }

    pub async fn validate_shader(&self, name: &str) -> Result<ShaderValidation> {
        let shaders = self.list_shaders().await?;
        let shader = shaders
            .into_iter()
            .find(|s| s.name == name)
            .ok_or_else(|| NeoCabError::InvalidInput(format!("Shader not found: {}", name)))?;

        Ok(ShaderValidation {
            valid: shader.is_valid,
            errors: shader.validation_errors,
        })
    }

    /// Get shader preset
    pub async fn get_preset(&self, preset_name: &str) -> Result<ShaderPreset> {
        let preset = match preset_name {
            "arcade" => ShaderPreset {
                name: "Arcade".to_string(),
                shader: "CRT - Geom".to_string(),
                parameters: vec![
                    ("CRTgamma".to_string(), 2.2),
                    ("monitorgamma".to_string(), 2.2),
                    ("d".to_string(), 1.5),
                ]
                .into_iter()
                .collect(),
            },
            "light" => ShaderPreset {
                name: "Light CRT".to_string(),
                shader: "Scanlines".to_string(),
                parameters: vec![
                    ("scanline_strength".to_string(), 0.4),
                    ("scanline_thickness".to_string(), 0.8),
                ]
                .into_iter()
                .collect(),
            },
            "heavy" => ShaderPreset {
                name: "Heavy CRT".to_string(),
                shader: "CRT - Geom".to_string(),
                parameters: vec![
                    ("CRTgamma".to_string(), 2.4),
                    ("monitorgamma".to_string(), 2.4),
                    ("d".to_string(), 2.0),
                ]
                .into_iter()
                .collect(),
            },
            _ => {
                return Err(NeoCabError::InvalidInput(format!(
                    "Unknown preset: {}",
                    preset_name
                )))
            }
        };

        Ok(preset)
    }

    /// Get all available presets
    pub fn list_presets(&self) -> Vec<&'static str> {
        vec!["arcade", "light", "heavy"]
    }

    pub fn get_shader_params(&self) -> Result<HashMap<String, f32>> {
        let params = self.active_parameters.read().map_err(|_| {
            NeoCabError::InvalidInput("Shader parameters lock poisoned".to_string())
        })?;

        Ok(params.clone())
    }

    pub fn set_shader_param(&self, param_name: &str, value: f32) -> Result<HashMap<String, f32>> {
        if !value.is_finite() {
            return Err(NeoCabError::InvalidInput(format!(
                "Shader parameter {} must be finite",
                param_name
            )));
        }

        let parameter = match self
            .all_parameters()
            .into_iter()
            .find(|param| param.name == param_name)
        {
            Some(parameter) => parameter,
            None if (0.0..=1.0).contains(&value) => ShaderParameter {
                name: param_name.to_string(),
                display_name: Self::display_name_from_uniform(param_name),
                param_type: "float".to_string(),
                min_value: 0.0,
                max_value: 1.0,
                default_value: 0.5,
            },
            None => {
                return Err(NeoCabError::InvalidInput(format!(
                    "Unknown shader parameter {} must be between 0 and 1",
                    param_name
                )))
            }
        };

        if value < parameter.min_value || value > parameter.max_value {
            return Err(NeoCabError::InvalidInput(format!(
                "Shader parameter {} must be between {} and {}",
                param_name, parameter.min_value, parameter.max_value
            )));
        }

        let mut params = self.active_parameters.write().map_err(|_| {
            NeoCabError::InvalidInput("Shader parameters lock poisoned".to_string())
        })?;
        params.insert(param_name.to_string(), value);

        Ok(params.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_test_dir(name: &str) -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("neocab_shader_{}_{}", name, suffix))
    }

    #[test]
    fn test_default_crt_shader() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let shader = manager.get_default_crt_shader();

        assert_eq!(shader.name, "CRT - Geom");
        assert_eq!(shader.shader_type, ShaderType::CRT);
        assert!(!shader.parameters.is_empty());
        assert!(shader.is_valid);
    }

    #[test]
    fn test_scanlines_shader() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let shader = manager.get_scanlines_shader();

        assert_eq!(shader.name, "Scanlines");
        assert_eq!(shader.shader_type, ShaderType::Scanlines);
    }

    #[test]
    fn test_list_presets() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let presets = manager.list_presets();

        assert!(presets.contains(&"arcade"));
        assert!(presets.contains(&"light"));
        assert!(presets.contains(&"heavy"));
    }

    #[tokio::test]
    async fn test_get_preset() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let preset = manager.get_preset("arcade").await.unwrap();

        assert_eq!(preset.name, "Arcade");
        assert_eq!(preset.shader, "CRT - Geom");
    }

    #[test]
    fn test_set_shader_param() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let params = manager.set_shader_param("brightness", 1.25).unwrap();

        assert_eq!(params.get("brightness"), Some(&1.25));
    }

    #[test]
    fn test_set_shader_param_rejects_out_of_range() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let result = manager.set_shader_param("brightness", 3.0);

        assert!(result.is_err());
    }

    #[test]
    fn test_validate_shader_source() {
        let source = "void main() { gl_FragColor = vec4(1.0); }";
        let validation = ShaderManager::validate_shader_source(source);

        assert!(validation.valid);
    }

    #[test]
    fn test_validate_shader_source_rejects_missing_main() {
        let source = "gl_FragColor = vec4(1.0);";
        let validation = ShaderManager::validate_shader_source(source);

        assert!(!validation.valid);
        assert!(validation.errors[0].contains("Line 1"));
    }

    #[test]
    fn test_validate_shader_source_reports_unmatched_brace_line() {
        let source = "void main() {\n  gl_FragColor = vec4(1.0);\n";
        let validation = ShaderManager::validate_shader_source(source);

        assert!(!validation.valid);
        assert!(validation
            .errors
            .iter()
            .any(|error| error.contains("Line 1") && error.contains("opening brace")));
    }

    #[test]
    fn test_parse_uniform_parameters_for_custom_shader() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let source = "uniform float rgb_separation;\nuniform int mask_strength;\nvoid main() { gl_FragColor = vec4(1.0); }";
        let parameters = manager.parse_uniform_parameters(source);

        assert!(parameters
            .iter()
            .any(|param| param.name == "rgb_separation"));
        assert!(parameters.iter().any(|param| param.name == "mask_strength"));
    }

    #[test]
    fn test_set_shader_param_accepts_custom_uniform_range() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let params = manager.set_shader_param("rgb_separation", 0.5).unwrap();

        assert_eq!(params.get("rgb_separation"), Some(&0.5));
    }

    #[test]
    fn test_set_shader_param_rejects_custom_uniform_out_of_range() {
        let manager = ShaderManager::new(PathBuf::from("/tmp"));
        let result = manager.set_shader_param("rgb_separation", 2.0);

        assert!(result.is_err());
    }

    #[test]
    fn test_shader_watcher_start_stop_status() {
        let custom_dir = unique_test_dir("watcher");
        let manager = ShaderManager::with_custom_path(PathBuf::from("/tmp"), custom_dir.clone());

        assert!(!manager.is_shader_watcher_running().unwrap());
        assert!(manager.start_shader_watcher(|| {}).unwrap());
        assert!(manager.is_shader_watcher_running().unwrap());
        assert!(!manager.start_shader_watcher(|| {}).unwrap());
        assert!(manager.stop_shader_watcher().unwrap());
        assert!(!manager.is_shader_watcher_running().unwrap());

        let _ = std::fs::remove_dir_all(custom_dir);
    }

    #[tokio::test]
    async fn test_rescan_shaders_loads_valid_custom_shader() {
        let custom_dir = unique_test_dir("valid");
        fs::create_dir_all(&custom_dir).await.unwrap();
        fs::write(
            custom_dir.join("valid.glsl"),
            "void main() { gl_FragColor = vec4(1.0); }",
        )
        .await
        .unwrap();

        let manager = ShaderManager::with_custom_path(PathBuf::from("/tmp"), custom_dir.clone());
        let (shaders, stats) = manager.rescan_shaders().await.unwrap();

        assert!(shaders
            .iter()
            .any(|shader| shader.name == "Custom - valid" && shader.is_valid));
        assert_eq!(stats.custom_shaders, 1);
        assert_eq!(stats.invalid_shaders, 0);

        let _ = fs::remove_dir_all(custom_dir).await;
    }

    #[tokio::test]
    async fn test_rescan_shaders_keeps_invalid_custom_shader_visible() {
        let custom_dir = unique_test_dir("invalid");
        fs::create_dir_all(&custom_dir).await.unwrap();
        fs::write(custom_dir.join("broken.glsl"), "void helper() {}")
            .await
            .unwrap();

        let manager = ShaderManager::with_custom_path(PathBuf::from("/tmp"), custom_dir.clone());
        let (shaders, stats) = manager.rescan_shaders().await.unwrap();
        let shader = shaders
            .iter()
            .find(|shader| shader.name == "Custom - broken")
            .unwrap();

        assert!(!shader.is_valid);
        assert_eq!(stats.custom_shaders, 1);
        assert_eq!(stats.invalid_shaders, 1);
        assert!(!shader.validation_errors.is_empty());

        let _ = fs::remove_dir_all(custom_dir).await;
    }

    #[tokio::test]
    async fn test_rescan_shaders_detects_custom_shader_changes() {
        let custom_dir = unique_test_dir("reload");
        let shader_path = custom_dir.join("reload.glsl");
        fs::create_dir_all(&custom_dir).await.unwrap();
        fs::write(&shader_path, "void helper() {}").await.unwrap();

        let manager = ShaderManager::with_custom_path(PathBuf::from("/tmp"), custom_dir.clone());
        let (initial_shaders, initial_stats) = manager.rescan_shaders().await.unwrap();
        let initial_shader = initial_shaders
            .iter()
            .find(|shader| shader.name == "Custom - reload")
            .unwrap();

        assert!(!initial_shader.is_valid);
        assert_eq!(initial_stats.invalid_shaders, 1);

        fs::write(&shader_path, "void main() { gl_FragColor = vec4(1.0); }")
            .await
            .unwrap();

        let (updated_shaders, updated_stats) = manager.rescan_shaders().await.unwrap();
        let updated_shader = updated_shaders
            .iter()
            .find(|shader| shader.name == "Custom - reload")
            .unwrap();

        assert!(updated_shader.is_valid);
        assert_eq!(updated_stats.invalid_shaders, 0);

        let _ = fs::remove_dir_all(custom_dir).await;
    }

    #[tokio::test]
    async fn test_list_shaders_uses_cache_until_rescan() {
        let custom_dir = unique_test_dir("cache");
        let shader_path = custom_dir.join("cached.glsl");
        fs::create_dir_all(&custom_dir).await.unwrap();
        fs::write(&shader_path, "void helper() {}").await.unwrap();

        let manager = ShaderManager::with_custom_path(PathBuf::from("/tmp"), custom_dir.clone());
        let cached_shaders = manager.list_shaders().await.unwrap();
        let cached_shader = cached_shaders
            .iter()
            .find(|shader| shader.name == "Custom - cached")
            .unwrap();

        assert!(!cached_shader.is_valid);
        assert!(manager.last_scan_stats().unwrap().is_some());

        fs::write(&shader_path, "void main() { gl_FragColor = vec4(1.0); }")
            .await
            .unwrap();

        let stale_shaders = manager.list_shaders().await.unwrap();
        let stale_shader = stale_shaders
            .iter()
            .find(|shader| shader.name == "Custom - cached")
            .unwrap();

        assert!(!stale_shader.is_valid);

        let (rescanned_shaders, _) = manager.rescan_shaders().await.unwrap();
        let rescanned_shader = rescanned_shaders
            .iter()
            .find(|shader| shader.name == "Custom - cached")
            .unwrap();

        assert!(rescanned_shader.is_valid);

        let _ = fs::remove_dir_all(custom_dir).await;
    }
}
