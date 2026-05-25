ALTER TABLE learning_paths ADD COLUMN target_profile_rules JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE learning_paths ADD COLUMN level TEXT NOT NULL DEFAULT 'BEGINNER';
ALTER TABLE learning_paths ADD COLUMN access_type TEXT NOT NULL DEFAULT 'FREE';
