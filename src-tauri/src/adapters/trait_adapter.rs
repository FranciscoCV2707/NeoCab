use crate::error::Result;
use async_trait::async_trait;

#[async_trait]
pub trait EmulatorAdapter: Send + Sync {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    async fn launch(&self, rom_path: &str) -> Result<()>;
    async fn stop(&self) -> Result<()>;
    async fn is_running(&self) -> bool;
}
