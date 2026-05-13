use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::Duration;
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
use reqwest::Client;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EarningsSyncPayload {
    pub cabinet_id: String,
    pub cabinet_name: String,
    pub total_earnings: f64,
    pub total_coins: u64,
    pub total_games_played: u64,
    pub timestamp: u64,
}

pub struct NetworkManager {
    daemon: ServiceDaemon,
    discovered_cabinets: Arc<RwLock<HashMap<String, CabinetInfo>>>,
    role: Arc<RwLock<NetworkRole>>,
    cabinet_id: String,
    cabinet_name: String,
    api_port: u16,
    db: Arc<crate::db::Database>,
    master_ip: Arc<RwLock<Option<String>>>,
    sync_interval: Duration,
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
            master_ip: Arc::new(RwLock::new(None)),
            sync_interval: Duration::from_secs(300), // 5 minutos por defecto
        })
    }

    pub fn start_server(&self) -> Result<()> {
        let port = self.api_port;
        let db = self.db.clone();
        let id = self.cabinet_id.clone();
        let name = self.cabinet_name.clone();
        let discovered = self.discovered_cabinets.clone();

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
            .route("/api/revenue/sync", post(move |AxumState(db): AxumState<Arc<crate::db::Database>>, Json(payload): Json<EarningsSyncPayload>| async move {
                info!("Received revenue sync from {} ({}): ${}", payload.cabinet_name, payload.cabinet_id, payload.total_earnings);
                // En una implementación real, aquí almacenarríamos el resumen remoto
                // Por ahora solo lo logeamos
                Json(serde_json::json!({"status": "received", "timestamp": payload.timestamp}))
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
        let master_ip = self.master_ip.clone();

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
                            ip: ip.clone(),
                            port: info.get_port(),
                            is_master: role_str == "Master",
                            last_seen: chrono::Utc::now().timestamp() as u64,
                        };

                        info!("Cabinet discovered: {} ({}) at {}:{}", cabinet.name, cabinet.id, cabinet.ip, cabinet.port);

                        // Si es maestro, guardar su IP para sincronización
                        if cabinet.is_master {
                            *master_ip.write().unwrap() = Some(cabinet.ip.clone());
                            info!("Master cabinet detected at {}", cabinet.ip);
                        }

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

    pub fn set_master_ip(&self, ip: String) {
        *self.master_ip.write().unwrap() = Some(ip.clone());
        info!("Master IP set to: {}", ip);
        *self.role.write().unwrap() = NetworkRole::Client;
    }

    pub fn get_master_ip(&self) -> Option<String> {
        self.master_ip.read().unwrap().clone()
    }

    pub async fn sync_revenue_to_master(&self) -> Result<()> {
        let master_ip = match self.get_master_ip() {
            Some(ip) => ip,
            None => {
                warn!("No master IP configured, skipping revenue sync");
                return Ok(());
            }
        };

        let earnings = self.db.get_earnings_summary().await?;

        let total_coins = earnings["total_coins"].as_i64().unwrap_or(0) as u64;
        let total_games_played = earnings["total_games"].as_i64().unwrap_or(0) as u64;
        let total_earnings = total_coins as f64;

        let payload = EarningsSyncPayload {
            cabinet_id: self.cabinet_id.clone(),
            cabinet_name: self.cabinet_name.clone(),
            total_earnings,
            total_coins,
            total_games_played,
            timestamp: chrono::Utc::now().timestamp() as u64,
        };

        let client = Client::new();
        let url = format!("http://{}:{}/api/revenue/sync", master_ip, self.api_port);

        match client.post(&url).json(&payload).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    debug!("Revenue sync successful to {}", master_ip);
                    Ok(())
                } else {
                    error!("Revenue sync failed with status: {}", response.status());
                    Err(crate::error::NeoCabError::Network(
                        format!("Revenue sync failed: {}", response.status())
                    ))
                }
            }
            Err(e) => {
                warn!("Failed to reach master {}: {}", master_ip, e);
                Err(crate::error::NeoCabError::Network(
                    format!("Failed to reach master: {}", e)
                ))
            }
        }
    }

    pub fn start_sync_task(&self) {
        let db = self.db.clone();
        let master_ip = self.master_ip.clone();
        let cabinet_id = self.cabinet_id.clone();
        let cabinet_name = self.cabinet_name.clone();
        let api_port = self.api_port;
        let sync_interval = self.sync_interval;

        tokio::spawn(async move {
            loop {
                tokio::time::sleep(sync_interval).await;

                let master = master_ip.read().unwrap().clone();
                if let Some(master) = master {
                    let client = Client::new();

                    if let Ok(earnings) = db.get_earnings_summary().await {
                        let total_coins = earnings["total_coins"].as_i64().unwrap_or(0) as u64;
                        let total_games_played = earnings["total_games"].as_i64().unwrap_or(0) as u64;
                        let total_earnings = total_coins as f64;

                        let payload = EarningsSyncPayload {
                            cabinet_id: cabinet_id.clone(),
                            cabinet_name: cabinet_name.clone(),
                            total_earnings,
                            total_coins,
                            total_games_played,
                            timestamp: chrono::Utc::now().timestamp() as u64,
                        };

                        let url = format!("http://{}:{}/api/revenue/sync", master, api_port);

                        match client.post(&url).json(&payload).send().await {
                            Ok(response) if response.status().is_success() => {
                                debug!("Periodic revenue sync successful");
                            }
                            Ok(response) => {
                                warn!("Revenue sync returned status: {}", response.status());
                            }
                            Err(e) => {
                                warn!("Revenue sync network error: {}", e);
                            }
                        }
                    }
                }
            }
        });

        info!("Revenue sync task started (interval: {} seconds)", sync_interval.as_secs());
    }
}
