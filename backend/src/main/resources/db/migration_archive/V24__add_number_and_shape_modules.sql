CREATE TABLE number_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_value INT NOT NULL UNIQUE CHECK (number_value >= 0),
  title TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_number_items_updated_at
BEFORE UPDATE ON number_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE number_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_item_id UUID NOT NULL REFERENCES number_items(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_number_examples_updated_at
BEFORE UPDATE ON number_examples
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE number_counting_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  image_url TEXT NULL,
  correct_number INT NOT NULL CHECK (correct_number >= 0),
  explanation_text TEXT NULL,
  success_feedback TEXT NULL,
  failure_feedback TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_number_counting_questions_updated_at
BEFORE UPDATE ON number_counting_questions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE shape_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape_name TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shape_items_updated_at
BEFORE UPDATE ON shape_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE shape_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape_item_id UUID NOT NULL REFERENCES shape_items(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shape_examples_updated_at
BEFORE UPDATE ON shape_examples
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE shape_recognition_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  image_url TEXT NULL,
  correct_shape_code TEXT NOT NULL,
  explanation_text TEXT NULL,
  success_feedback TEXT NULL,
  failure_feedback TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_shape_recognition_questions_updated_at
BEFORE UPDATE ON shape_recognition_questions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
