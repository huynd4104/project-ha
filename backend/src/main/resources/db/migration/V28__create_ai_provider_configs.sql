CREATE TABLE ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE,
    evaluation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    semantic_model VARCHAR(100) NOT NULL DEFAULT 'gemini-3.1-flash-lite',
    api_key_encrypted TEXT,
    timeout_ms INTEGER NOT NULL DEFAULT 8000,
    last_tested_at TIMESTAMPTZ,
    last_test_status VARCHAR(30),
    last_test_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row for GEMINI
INSERT INTO ai_provider_configs (provider, semantic_model)
VALUES ('GEMINI', 'gemini-3.1-flash-lite')
ON CONFLICT (provider) DO NOTHING;
