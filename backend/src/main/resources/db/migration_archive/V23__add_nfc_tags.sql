CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE nfc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_uid TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  payload_value TEXT,
  spoken_text TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_nfc_tags_updated_at
BEFORE UPDATE ON nfc_tags
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
