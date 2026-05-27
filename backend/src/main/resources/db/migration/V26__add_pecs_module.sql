CREATE TABLE pecs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('EMOTION', 'DAILY_ACTIVITY', 'NON_TOPIC')),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  spoken_text TEXT NOT NULL CHECK (length(trim(spoken_text)) > 0),
  image_url TEXT NULL,
  nfc_tag_id UUID NULL REFERENCES nfc_tags(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_pecs_cards_updated_at
BEFORE UPDATE ON pecs_cards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
