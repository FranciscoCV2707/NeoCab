-- Migration 003: Extended media types + scrape metadata
-- Adds screenshot, wheel, bezel, fanart, 3D box, cartridge, manual paths
-- and tracks which scraper provided the data and when.

ALTER TABLE games ADD COLUMN screenshot_path TEXT;
ALTER TABLE games ADD COLUMN wheel_path      TEXT;
ALTER TABLE games ADD COLUMN bezel_path      TEXT;
ALTER TABLE games ADD COLUMN fanart_path     TEXT;
ALTER TABLE games ADD COLUMN box3d_path      TEXT;
ALTER TABLE games ADD COLUMN cartridge_path  TEXT;
ALTER TABLE games ADD COLUMN manual_path     TEXT;
ALTER TABLE games ADD COLUMN media_source    TEXT;
ALTER TABLE games ADD COLUMN scraped_at      TEXT;
