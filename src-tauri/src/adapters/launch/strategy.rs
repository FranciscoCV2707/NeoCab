use crate::error::Result;
use async_trait::async_trait;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct LaunchContext {
    pub rom_path: PathBuf,
    pub emulator_path: Option<PathBuf>,
    pub emulator_args: Option<String>,
    pub system_name: String,
    pub game_title: String,
    pub pre_script: Option<String>,
    pub post_script: Option<String>,
}

#[derive(Debug, Clone)]
pub struct LaunchResult {
    pub process_id: Option<u32>,
    pub resolved_path: Option<PathBuf>,
    pub method: String,
}

#[async_trait]
pub trait LaunchStrategy: Send + Sync {
    fn name(&self) -> &str;
    fn priority(&self) -> u32;
    async fn can_handle(&self, ctx: &LaunchContext) -> bool;
    async fn launch(&self, ctx: &LaunchContext) -> Result<LaunchResult>;
}

pub async fn execute_launch(
    strategies: &[Box<dyn LaunchStrategy>],
    ctx: LaunchContext,
) -> Result<LaunchResult> {
    for strategy in strategies {
        if strategy.can_handle(&ctx).await {
            tracing::info!("Launching with strategy: {}", strategy.name());
            return strategy.launch(&ctx).await;
        }
    }
    Err(crate::error::NeoCabError::InvalidInput(
        "No suitable launch strategy found".to_string(),
    ))
}
