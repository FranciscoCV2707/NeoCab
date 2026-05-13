use thiserror::Error;
use serde::Serialize;

#[derive(Error, Debug)]
pub enum NeoCabError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Emulator not found: {0}")]
    EmulatorNotFound(String),

    #[error("Game not found: {0}")]
    GameNotFound(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("System error: {0}")]
    System(String),

    #[error("Legacy SDL2 error: {0}")]
    Legacy(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Unknown error")]
    Unknown,
}

impl Serialize for NeoCabError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type Result<T> = std::result::Result<T, NeoCabError>;
