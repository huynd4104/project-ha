ALTER TABLE dialogues ADD COLUMN scene_text TEXT;
ALTER TABLE dialogues ADD COLUMN audio_url TEXT;
ALTER TABLE dialogues ADD COLUMN question_text TEXT;
ALTER TABLE dialogues ADD COLUMN option_a TEXT;
ALTER TABLE dialogues ADD COLUMN option_b TEXT;
ALTER TABLE dialogues ADD COLUMN option_c TEXT;
ALTER TABLE dialogues ADD COLUMN option_d TEXT;
ALTER TABLE dialogues ADD COLUMN correct_option TEXT;

ALTER TABLE dialogues DROP COLUMN IF EXISTS lines;
