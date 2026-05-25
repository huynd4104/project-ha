ALTER TABLE math_questions ADD COLUMN option_a TEXT;
ALTER TABLE math_questions ADD COLUMN option_b TEXT;
ALTER TABLE math_questions ADD COLUMN option_c TEXT;
ALTER TABLE math_questions ADD COLUMN option_d TEXT;

ALTER TABLE math_questions DROP COLUMN IF EXISTS options;
