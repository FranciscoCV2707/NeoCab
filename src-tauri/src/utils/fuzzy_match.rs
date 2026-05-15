use std::path::{Path, PathBuf};

/// Jaro-Winkler distance implementation.
/// Returns a similarity score between 0.0 and 1.0.
pub fn jaro_winkler(a: &str, b: &str) -> f64 {
    if a.is_empty() && b.is_empty() {
        return 1.0;
    }
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }

    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let a_len = a_chars.len();
    let b_len = b_chars.len();

    let match_distance = (a_len.max(b_len) / 2).saturating_sub(1).max(0);

    let mut a_matches = vec![false; a_len];
    let mut b_matches = vec![false; b_len];
    let mut matches = 0usize;
    let mut transpositions = 0usize;

    for i in 0..a_len {
        let start = if i > match_distance { i - match_distance } else { 0 };
        let end = (i + match_distance + 1).min(b_len);

        for j in start..end {
            if b_matches[j] || a_chars[i] != b_chars[j] {
                continue;
            }
            a_matches[i] = true;
            b_matches[j] = true;
            matches += 1;
            break;
        }
    }

    if matches == 0 {
        return 0.0;
    }

    let mut k = 0usize;
    for i in 0..a_len {
        if !a_matches[i] {
            continue;
        }
        while !b_matches[k] {
            k += 1;
        }
        if a_chars[i] != b_chars[k] {
            transpositions += 1;
        }
        k += 1;
    }

    let jaro = (matches as f64 / a_len as f64
        + matches as f64 / b_len as f64
        + (matches as f64 - transpositions as f64 / 2.0) / matches as f64)
        / 3.0;

    // Winkler prefix bonus
    let prefix_limit = 4usize.min(a_len).min(b_len);
    let mut prefix = 0usize;
    for i in 0..prefix_limit {
        if a_chars[i] == b_chars[i] {
            prefix += 1;
        } else {
            break;
        }
    }

    jaro + (prefix as f64 * 0.1 * (1.0 - jaro))
}

/// Normalize a filename for comparison: lowercase, remove extension, strip non-alphanumeric.
pub fn normalize_name(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
}

/// Find the best matching artwork for a given game title
pub fn find_best_artwork(
    game_title: &str,
    artwork_dir: &Path,
    threshold: f64,
) -> Option<(PathBuf, f64, String)> {
    if !artwork_dir.exists() {
        return None;
    }

    let normalized_title = normalize_name(game_title);

    // Step 1: exact match (fast path)
    if let Some(exact) = find_exact_match(&normalized_title, artwork_dir) {
        return Some((exact, 1.0, "exact".to_string()));
    }

    // Step 2: fuzzy match
    let mut best: Option<(PathBuf, f64)> = None;

    if let Ok(entries) = std::fs::read_dir(artwork_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !is_supported_image(&path) {
                continue;
            }

            let filename = path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(normalize_name)
                .unwrap_or_default();

            if filename.is_empty() {
                continue;
            }

            let similarity = jaro_winkler(&normalized_title, &filename);

            if similarity >= threshold {
                match &best {
                    Some((_, best_sim)) if similarity > *best_sim => {
                        best = Some((path, similarity));
                    }
                    None => {
                        best = Some((path, similarity));
                    }
                    _ => {}
                }
            }
        }
    }

    best.map(|(path, sim)| (path, sim, "fuzzy".to_string()))
}

fn find_exact_match(normalized_title: &str, dir: &Path) -> Option<PathBuf> {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !is_supported_image(&path) {
                continue;
            }
            let filename = path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(normalize_name)
                .unwrap_or_default();
            if filename == normalized_title {
                return Some(path);
            }
        }
    }
    None
}

fn is_supported_image(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()),
        Some("png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jaro_winkler_identical() {
        let sim = jaro_winkler("pacman", "pacman");
        assert!((sim - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_jaro_winkler_completely_different() {
        let sim = jaro_winkler("abc", "xyz");
        assert!(sim < 0.3);
    }

    #[test]
    fn test_jaro_winkler_similar() {
        let sim = jaro_winkler("mario", "mari_o");
        assert!(sim > 0.8);
    }

    #[test]
    fn test_normalize_name() {
        assert_eq!(normalize_name("Super Mario Bros (USA).nes"), "super mario bros usa");
        assert_eq!(normalize_name("The_Legend_of_Zelda!"), "the legend of zelda");
    }

    #[test]
    fn test_empty_strings() {
        assert!((jaro_winkler("", "") - 1.0).abs() < 0.001);
        assert!((jaro_winkler("", "x") - 0.0).abs() < 0.001);
    }
}
