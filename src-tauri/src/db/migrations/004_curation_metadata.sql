-- Migration 004: Arcade curation metadata
-- Adds buttons, control_type, joystick_direction, category, and orientation columns.

ALTER TABLE games ADD COLUMN buttons            INTEGER;
ALTER TABLE games ADD COLUMN control_type        TEXT;
ALTER TABLE games ADD COLUMN joystick_direction TEXT;
ALTER TABLE games ADD COLUMN category            TEXT;
ALTER TABLE games ADD COLUMN orientation         TEXT;
