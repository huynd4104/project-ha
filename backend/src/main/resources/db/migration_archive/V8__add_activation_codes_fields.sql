ALTER TABLE activation_codes ADD COLUMN label TEXT;
ALTER TABLE activation_codes ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE activation_codes ADD COLUMN per_user_limit INT;
