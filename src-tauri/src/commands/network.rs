use crate::core::network_manager::{CabinetInfo, NetworkManager, NetworkRole};
use crate::error::Result;
use tauri::State;

#[tauri::command]
pub async fn list_discovered_cabinets(
    network_manager: State<'_, NetworkManager>,
) -> Result<Vec<CabinetInfo>> {
    Ok(network_manager.get_discovered_cabinets())
}

#[tauri::command]
pub async fn get_network_role(network_manager: State<'_, NetworkManager>) -> Result<NetworkRole> {
    Ok(network_manager.get_role())
}

#[tauri::command]
pub async fn set_network_role(
    role: NetworkRole,
    network_manager: State<'_, NetworkManager>,
) -> Result<()> {
    network_manager.set_role(role);
    Ok(())
}

#[tauri::command]
pub async fn start_network_discovery(network_manager: State<'_, NetworkManager>) -> Result<()> {
    network_manager.start_discovery()
}

#[tauri::command]
pub async fn start_network_advertising(network_manager: State<'_, NetworkManager>) -> Result<()> {
    network_manager.start_advertising()
}

#[tauri::command]
pub async fn start_revenue_sync(network_manager: State<'_, NetworkManager>) -> Result<()> {
    network_manager.start_sync_task();
    Ok(())
}

#[tauri::command]
pub async fn sync_revenue_now(network_manager: State<'_, NetworkManager>) -> Result<()> {
    network_manager.sync_revenue_to_master().await
}

#[tauri::command]
pub async fn set_master_ip(ip: String, network_manager: State<'_, NetworkManager>) -> Result<()> {
    network_manager.set_master_ip(ip);
    Ok(())
}

#[tauri::command]
pub async fn get_master_ip(network_manager: State<'_, NetworkManager>) -> Result<Option<String>> {
    Ok(network_manager.get_master_ip())
}

#[tauri::command]
pub async fn get_network_info(
    network_manager: State<'_, NetworkManager>,
) -> Result<serde_json::Value> {
    Ok(serde_json::json!({
        "role": network_manager.get_role(),
        "master_ip": network_manager.get_master_ip(),
        "discovered_count": network_manager.get_discovered_cabinets().len()
    }))
}
