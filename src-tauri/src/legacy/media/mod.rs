use std::path::PathBuf;
use std::collections::HashMap;

/// Media system for legacy mode (images, backgrounds, etc.)
pub struct MediaLoader {
    cache: HashMap<String, Vec<u8>>,
    media_root: PathBuf,
}

impl MediaLoader {
    pub fn new(media_root: PathBuf) -> Self {
        tracing::info!("Initializing media loader: {:?}", media_root);

        Self {
            cache: HashMap::new(),
            media_root,
        }
    }

    pub fn load_image(&mut self, path: &str) -> Result<Vec<u8>, String> {
        // Check cache first
        if let Some(data) = self.cache.get(path) {
            tracing::trace!("Image loaded from cache: {}", path);
            return Ok(data.clone());
        }

        // Load from filesystem
        let full_path = self.media_root.join(path);
        match std::fs::read(&full_path) {
            Ok(data) => {
                tracing::trace!("Image loaded from filesystem: {:?}", full_path);
                self.cache.insert(path.to_string(), data.clone());
                Ok(data)
            }
            Err(e) => {
                tracing::warn!("Failed to load image {}: {}", path, e);
                Err(format!("Failed to load image {}: {}", path, e))
            }
        }
    }

    pub fn preload_system_media(&mut self, system_name: &str) -> Result<(), String> {
        let system_path = format!("media/{}/Images/Wheel", system_name);
        tracing::info!("Preloading media for system: {}", system_name);

        // Attempt to load wheel images
        if let Ok(entries) = std::fs::read_dir(self.media_root.join(&system_path)) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
                        if let Some(filename) = entry.file_name().to_str() {
                            if filename.ends_with(".png") || filename.ends_with(".jpg") {
                                let rel_path = format!("{}/{}", system_path, filename);
                                let _ = self.load_image(&rel_path);
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    pub fn clear_cache(&mut self) {
        self.cache.clear();
        tracing::info!("Media cache cleared");
    }

    pub fn get_cache_size(&self) -> usize {
        self.cache.values().map(|v| v.len()).sum()
    }
}

impl Default for MediaLoader {
    fn default() -> Self {
        Self::new(PathBuf::from("./media"))
    }
}
