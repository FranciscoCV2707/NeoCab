use tauri::State;
use crate::core::network_manager::{NetworkManager, CabinetInfo, NetworkRole};
use crate::error::Result;

#[tauri::command]
pub async fn list_discovered_cabinets(
    network_manager: State<'_, NetworkManager>
) -> Result<Vec<CabinetInfo>> {
    Ok(network_manager.get_discovered_cabinets())
}

#[tauri::command]
pub async fn get_network_role(
    network_manager: State<'_, NetworkManager>
) -> Result<NetworkRole> {
    Ok(network_manager.get_role())
}

#[tauri::command]
pub async fn set_network_role(
    role: NetworkRole,
    network_manager: State<'_, NetworkManager>
) -> Result<()> {
    network_manager.set_role(role);
    Ok(())
}

#[tauri::command]
pub async fn start_network_discovery(
    network_manager: State<'_, NetworkManager>
) -> Result<()> {
    network_manager.start_discovery()
}

#[tauri::command]
pub async fn start_network_advertising(
    network_manager: State<'_, NetworkManager>
) -> Result<()> {
    network_manager.start_advertising()
}
