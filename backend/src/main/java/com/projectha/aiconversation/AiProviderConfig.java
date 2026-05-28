package com.projectha.aiconversation;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AiProviderConfig(
    UUID id,
    String provider,
    boolean evaluationEnabled,
    String semanticModel,
    String apiKeyEncrypted,
    int timeoutMs,
    OffsetDateTime lastTestedAt,
    String lastTestStatus,
    String lastTestMessage,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

record ResolvedGeminiConfig(
    boolean enabled,
    String apiKey,
    String semanticModel,
    int timeoutMs
) {}
