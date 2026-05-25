-- Add missing columns to path_items table
ALTER TABLE path_items ADD COLUMN IF NOT EXISTS prerequisite_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE path_items ADD COLUMN IF NOT EXISTS required_completion BOOLEAN NOT NULL DEFAULT true;
