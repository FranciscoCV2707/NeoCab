-- Migration: 006_dat_metadata
-- Description: Create dat_metadata table for offline DAT verification scanner

CREATE TABLE IF NOT EXISTS dat_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dat_name TEXT,
    game_title TEXT,
    rom_filename TEXT,
    crc32 TEXT UNIQUE,
    sha1 TEXT,
    md5 TEXT
);

CREATE INDEX IF NOT EXISTS idx_dat_metadata_crc32 ON dat_metadata(crc32);
