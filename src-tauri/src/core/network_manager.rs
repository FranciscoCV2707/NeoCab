use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use mdns_sd::{ServiceDaemon, ServiceInfo, ServiceEvent};
use tracing::{info, error, warn, debug};
use crate::error::Result;
use axum::{
    routing::{get, post},
    Router,
    Json,
    extract::State as AxumState,
};
use std::net::SocketAddr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CabinetInfo {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub is_master: bool,
    pub last_seen: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum NetworkRole {
    Standalone,
    Master,
    Client,
}

pub struct NetworkManager {
    daemon: ServiceDaemon,
    discovered_cabinets: Arc<RwLock<HashMap<String, CabinetInfo>>>,
    role: Arc<RwLock<NetworkRole>>,
    cabinet_id: String,
    cabinet_name: String,
    api_port: u16,
    db: Arc<crate::db::Database>,
}

impl NetworkManager {
    pub fn new(cabinet_id: String, cabinet_name: String, api_port: u16, db: Arc<crate::db::Database>) -> Result<Self> {
        let daemon = ServiceDaemon::new().map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to start mDNS daemon: {}", e))
        })?;

        Ok(Self {
            daemon,
            discovered_cabinets: Arc::new(RwLock::new(HashMap::new())),
            role: Arc::new(RwLock::new(NetworkRole::Standalone)),
            cabinet_id,
            cabinet_name,
            api_port,
            db,
        })
    }

    pub fn start_server(&self) -> Result<()> {
        let port = self.api_port;
        let db = self.db.clone();
        let id = self.cabinet_id.clone();
        let name = self.cabinet_name.clone();

        let app = Router::new()
            .route("/api/status", get(move || async move {
                Json(serde_json::json!({
                    "id": id,
                    "name": name,
                    "status": "online",
                    "version": "3.0.0"
                }))
            }))
            .route("/api/revenue", get(move |AxumState(db): AxumState<Arc<crate::db::Database>>| async move {
                match db.get_earnings_summary().await {
                    Ok(summary) => Json(summary),
                    Err(e) => {
                        error!("Failed to get earnings summary: {}", e);
                        Json(serde_json::json!({"error": e.to_string()}))
                    }
                }
            }))
            .with_state(db);

        tokio::spawn(async move {
            let addr = SocketAddr::from(([0, 0, 0, 0], port));
            info!("NeoCab API Server listening on {}", addr);
            
            let listener = match tokio::net::TcpListener::bind(addr).await {
                Ok(l) => l,
                Err(e) => {
                    error!("Failed to bind to {}: {}", addr, e);
                    return;
                }
            };
            
            if let Err(e) = axum::serve(listener, app).await {
                error!("API Server error: {}", e);
            }
        });

        Ok(())
    }

    pub fn start_advertising(&self) -> Result<()> {
        let service_type = "_neocab._tcp.local.";
        let instance_name = format!("{}.{}", self.cabinet_name, self.cabinet_id);
        let host_name = format!("{}.local.", self.cabinet_id);
        let port = self.api_port;
        
        let mut properties = HashMap::new();
        properties.insert("id".to_string(), self.cabinet_id.clone());
        properties.insert("name".to_string(), self.cabinet_name.clone());
        properties.insert("role".to_string(), format!("{:?}", *self.role.read().unwrap()));

        let service_info = ServiceInfo::new(
            service_type,
            &instance_name,
            &host_name,
            "",
            port,
            Some(properties),
        ).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to create service info: {}", e))
        })?;

        self.daemon.register(service_info).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to register mDNS service: {}", e))
        })?;

        info!("mDNS Advertising started for {} on port {}", instance_name, port);
        Ok(())
    }

    pub fn start_discovery(&self) -> Result<()> {
        let service_type = "_neocab._tcp.local.";
        let receiver = self.daemon.browse(service_type).map_err(|e| {
            crate::error::NeoCabError::System(format!("Failed to start mDNS browsing: {}", e))
        })?;

        let discovered = self.discovered_cabinets.clone();

        tokio::spawn(async move {
            while let Ok(event) = receiver.recv_async().await {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        let id = info.get_property_val_str("id").unwrap_or("unknown").to_string();
                        let name = info.get_property_val_str("name").unwrap_or("unknown").to_string();
                        let role_str = info.get_property_val_str("role").unwrap_or("Standalone");
                        
                        let ip = info.get_addresses().iter().next()
                            .map(|a| a.to_string())
                            .unwrap_or_else(|| "0.0.0.0".to_string());
                            
                        let cabinet = CabinetInfo {
                            id: id.clone(),
                            name,
                            ip,
                            port: info.get_port(),
                            is_master: role_str == "Master",
                            last_seen: chrono::Utc::now().timestamp() as u64,
                        };

                        info!("Cabinet discovered: {} ({}) at {}:{}", cabinet.name, cabinet.id, cabinet.ip, cabinet.port);
                        discovered.write().unwrap().insert(id, cabinet);
                    }
                    ServiceEvent::ServiceRemoved(_type, name) => {
                        info!("Cabinet removed: {}", name);
                        // We might want to filter and remove from HashMap here
                    }
                    _ => {}
                }
            }
        });

        info!("mDNS Discovery started");
        Ok(())
    }

    pub fn get_discovered_cabinets(&self) -> Vec<CabinetInfo> {
        self.discovered_cabinets.read().unwrap().values().cloned().collect()
    }

    pub fn set_role(&self, role: NetworkRole) {
        *self.role.write().unwrap() = role;
        // Re-advertising might be needed to update properties
        let _ = self.start_advertising();
    }

    pub fn get_role(&self) -> NetworkRole {
        *self.role.read().unwrap()
    }
}
