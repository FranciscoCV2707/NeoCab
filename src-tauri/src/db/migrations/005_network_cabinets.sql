-- Migration 005: Network Cabinets sync schema
-- Creates remote_cabinets table to store revenue and status syncs from other cabs.

CREATE TABLE IF NOT EXISTS remote_cabinets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    total_revenue REAL DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    total_roms INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 1,
    last_sync TEXT DEFAULT (datetime('now'))
);
