package com.projectha.aiconversation;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiProviderConfigRepository {
    private final JdbcTemplate jdbc;

    public AiProviderConfigRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AiProviderConfig findByProvider(String provider) {
        return jdbc.queryForList(
                "SELECT * FROM ai_provider_configs WHERE provider = ?", provider)
                .stream().map(AiProviderConfigMapper::config)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("AI provider config not found: " + provider));
    }

    public AiProviderConfig create(UUID id, Map<String, Object> payload) {
        return AiProviderConfigMapper.config(jdbc.queryForMap(
                """
                INSERT INTO ai_provider_configs (
                    id, provider, evaluation_enabled, semantic_model, api_key_encrypted,
                    timeout_ms, last_tested_at, last_test_status, last_test_message
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
                """,
                id,
                payload.get("provider"),
                payload.getOrDefault("evaluationEnabled", false),
                payload.getOrDefault("semanticModel", "gemini-3.1-flash-lite"),
                payload.get("apiKeyEncrypted"),
                payload.getOrDefault("timeoutMs", 8000),
                payload.get("lastTestedAt"),
                payload.get("lastTestStatus"),
                payload.get("lastTestMessage")
        ));
    }

    public AiProviderConfig update(UUID id, Map<String, Object> payload) {
        // For simplicity, we will just require the entity exists and then update.
        // In practice, we might want to only update non-null fields.
        require(id);
        return AiProviderConfigMapper.config(jdbc.queryForMap(
                """
                UPDATE ai_provider_configs SET
                    evaluation_enabled = ?,
                    semantic_model = ?,
                    api_key_encrypted = COALESCE(?, api_key_encrypted),
                    timeout_ms = ?,
                    last_tested_at = ?,
                    last_test_status = ?,
                    last_test_message = ?,
                    updated_at = NOW()
                WHERE id = ?
                RETURNING *
                """,
                payload.getOrDefault("evaluationEnabled", false),
                payload.getOrDefault("semanticModel", "gemini-3.1-flash-lite"),
                payload.get("apiKeyEncrypted"), // can be null to keep old
                payload.getOrDefault("timeoutMs", 8000),
                payload.get("lastTestedAt"),
                payload.get("lastTestStatus"),
                payload.get("lastTestMessage"),
                id
        ));
    }

    public void require(UUID id) {
        // Find by id instead of provider string
        jdbc.queryForList("SELECT * FROM ai_provider_configs WHERE id = ?", id)
            .stream().findFirst().orElseThrow(() -> new NotFoundException("AI provider config not found"));
    }

    public AiProviderConfig save(AiProviderConfig config) {
        // Simple upsert: if exists update, else insert.
        try {
            return update(config.id(), toMap(config));
        } catch (NotFoundException e) {
            return create(UUID.randomUUID(), toMap(config));
        }
    }

    private Map<String, Object> toMap(AiProviderConfig config) {
        java.util.Map<String, Object> params = new java.util.HashMap<>();
        params.put("provider", config.provider());
        params.put("evaluationEnabled", config.evaluationEnabled());
        params.put("semanticModel", config.semanticModel());
        params.put("apiKeyEncrypted", config.apiKeyEncrypted());
        params.put("timeoutMs", config.timeoutMs());
        params.put("lastTestedAt", config.lastTestedAt());
        params.put("lastTestStatus", config.lastTestStatus());
        params.put("lastTestMessage", config.lastTestMessage());
        return params;
    }
}
