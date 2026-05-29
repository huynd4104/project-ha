-- Relax tag_uid NOT NULL constraint for nfc_tags
ALTER TABLE nfc_tags ALTER COLUMN tag_uid DROP NOT NULL;
