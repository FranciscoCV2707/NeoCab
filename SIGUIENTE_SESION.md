# 📋 SIGUIENTE SESIÓN - Phase 7 Week 2: Revenue Sync & Remote Dashboard

**Última sesión completada:** 2026-05-12 (Session 6 - Phase 7 Week 1)  
**Commit:** `5a0410c` — Phase 7 Week 1 network infrastructure  
**Estado actual:** ✅ Phase 7 Week 1 COMPLETA | Network discovery + API server funcional  

## 🎯 Objetivos para la Sesión 7

### 1. Revenue Synchronization (Sincronización de Recaudación)
- [ ] Implementar cliente HTTP `reqwest` en `NetworkManager` para push periódico de `earnings_summary` al Maestro
- [ ] Agregar `sync_interval` configurable en `NetworkConfig` (default: 5 minutos)
- [ ] Lógica de reconciliación en Master: consolidar ingresos de múltiples clientes
- [ ] Manejo de desconexiones/reconexiones automáticas

**Archivos a modificar:**
- `src-tauri/src/core/network_manager.rs` — agregar método `sync_revenue_to_master()`
- `src-tauri/Cargo.toml` — agregar `reqwest` con features `["json", "blocking"]`

### 2. NetworkPanel Integration en Operator Panel
- [ ] Crear router/tab system en `OperatorPanel.tsx` (Statistics | Network | Settings)
- [ ] Mostrar lista de gabinetes conectados con estado (online/offline)
- [ ] Ver earnings por gabinete en tiempo real

**Archivos a crear/modificar:**
- `src/components/operator/OperatorPanel.tsx` — agregar TabNavigation
- `src/components/operator/MasterDashboard.tsx` — NEW - vista consolidada de múltiples gabinetes

### 3. Remote Mobile UI (Opcional - Phase 7 Week 2+)
- [ ] Crear componente React que consuma `/api/status` + `/api/revenue`
- [ ] Probar acceso desde navegador local (http://cabinet-ip:8000/remote)

---

## 📊 Status Actual (Post-Commit)

✅ **Phase 7 Week 1 COMPLETA:**
- mDNS Discovery/Advertising
- Axum API Server (GET /api/status, /api/revenue)
- NetworkManager God Node
- useNetwork.ts hook + NetworkPanel.tsx UI
- Database helpers (`get_earnings_summary()`)

⏳ **Phase 7 Week 2 (Esta sesión):**
- Revenue sync client (push periódico)
- Master consolidation logic
- NetworkPanel integrado en Operator Panel

---

**Build status:** ✅ `cargo check` OK | ✅ `npm run build` OK
