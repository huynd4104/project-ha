-- Change unlock_rule column in path_items from JSONB to TEXT
ALTER TABLE path_items ALTER COLUMN unlock_rule TYPE TEXT USING unlock_rule::text;
ALTER TABLE path_items ALTER COLUMN unlock_rule SET DEFAULT 'ALWAYS_OPEN';
