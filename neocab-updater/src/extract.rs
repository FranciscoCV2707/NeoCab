use std::fs;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use std::io::Read;

pub fn extract_zip(zip_path: &str, dest: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path)
        .map_err(|e| format!("Cannot open ZIP: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Invalid ZIP: {}", e))?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)
            .map_err(|e| format!("Cannot read entry {}: {}", i, e))?;

        let entry_name = entry
            .name()
            .to_string();

        // Zip Slip protection: reject paths with parent directory components
        let safe_path = sanitize_path(&entry_name)
            .ok_or_else(|| format!("Unsafe path in ZIP: {}", entry_name))?;

        let full_path = dest.join(&safe_path);

        if entry.is_dir() {
            fs::create_dir_all(&full_path)
                .map_err(|e| format!("Cannot create directory {}: {}", full_path.display(), e))?;
        } else {
            if let Some(parent) = full_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Cannot create parent: {}", e))?;
            }

            let mut out = fs::File::create(&full_path)
                .map_err(|e| format!("Cannot create file {}: {}", full_path.display(), e))?;

            let mut buffer = Vec::new();
            entry.read_to_end(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;

            std::io::copy(&mut buffer.as_slice(), &mut out)
                .map_err(|e| format!("Write error: {}", e))?;
        }

        println!("  extracted: {}", safe_path.display());
    }

    Ok(())
}

fn sanitize_path(entry_name: &str) -> Option<PathBuf> {
    // Normalize to forward slashes and check for path traversal
    let normalized = entry_name.replace('\\', "/");
    let components: Vec<&str> = normalized.split('/').collect();

    let mut safe = PathBuf::new();
    for component in components {
        match component {
            "." | "" => continue,
            ".." => return None, // Zip Slip!
            _ => safe.push(component),
        }
    }

    Some(safe)
}
