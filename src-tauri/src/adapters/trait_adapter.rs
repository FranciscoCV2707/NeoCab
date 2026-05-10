use async_trait::async_trait;
use crate::error::Result;

#[async_trait]
pub trait EmulatorAdapter: Send + Sync {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    async fn launch(&self, rom_path: &str) -> Result<()>;
    async fn stop(&self) -> Result<()>;
}
