package com.projectha.aiconversation;

import java.util.Map;

public final class AiProviderConfigMapper {
    private AiProviderConfigMapper() {}

    public static AiProviderConfig config(Map<String, Object> row) {
        return new AiProviderConfig(
            AiConversationMapper.uuid(row.get("id")),
            AiConversationMapper.str(row.get("provider")),
            AiConversationMapper.bool(row.get("evaluation_enabled"), false),
            AiConversationMapper.str(row.get("semantic_model")),
            AiConversationMapper.str(row.get("api_key_encrypted")),
            AiConversationMapper.intValue(row.get("timeout_ms"), 8000),
            AiConversationMapper.offset(row.get("last_tested_at")),
            AiConversationMapper.str(row.get("last_test_status")),
            AiConversationMapper.str(row.get("last_test_message")),
            AiConversationMapper.offset(row.get("created_at")),
            AiConversationMapper.offset(row.get("updated_at"))
        );
    }
}
