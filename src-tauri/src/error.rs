use thiserror::Error;

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

    #[error("Unknown error")]
    Unknown,
}

pub type Result<T> = std::result::Result<T, NeoCabError>;
