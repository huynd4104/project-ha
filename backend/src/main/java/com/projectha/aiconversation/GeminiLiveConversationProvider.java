package com.projectha.aiconversation;

import com.projectha.common.BadRequestException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GeminiLiveConversationProvider implements AiLiveConversationProvider {
    private final String apiKey;
    private final String model;
    private final boolean enabled;
    private final String responseLanguage;
    private final int sessionDurationSeconds;
    private final int tokenTtlSeconds;

    public GeminiLiveConversationProvider(
        @Value("${project-ha.ai.gemini.api-key:}") String apiKey,
        @Value("${project-ha.ai.gemini.live-model:gemini-3.1-flash-live-preview}") String model,
        @Value("${project-ha.ai.gemini.live-enabled:false}") boolean enabled,
        @Value("${project-ha.ai.gemini.response-language:vi-VN}") String responseLanguage,
        @Value("${project-ha.ai.gemini.session-duration-seconds:180}") int sessionDurationSeconds,
        @Value("${project-ha.ai.gemini.token-ttl-seconds:300}") int tokenTtlSeconds
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.enabled = enabled;
        this.responseLanguage = responseLanguage;
        this.sessionDurationSeconds = sessionDurationSeconds;
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    @Override
    public AiLiveSessionConfig createLiveSession(AiConversationSession session, AiConversationTopic topic, List<AiConversationQuestion> questions) {
        if (enabled && apiKey.isBlank()) {
            throw new BadRequestException("Cấu hình Gemini Live chưa hoàn chỉnh. Vui lòng kiểm tra GEMINI_API_KEY.");
        }
        boolean isLive = enabled && !apiKey.isBlank();
        String liveSessionId = isLive
            ? "gemini-live-" + UUID.randomUUID()
            : "mock-live-" + UUID.randomUUID();
        
        // TODO: Currently, this ephemeralToken is an internal mock session identifier (UUID-based).
        // Real Gemini Multimodal Live API ephemeral token provisioning is not yet connected 
        // to Google's Vertex AI / Gemini API Control Plane.
        // The mobile client uses this token to fallback to device-native STT (Speech-to-Text).
        String ephemeralToken = isLive
            ? "eph-mock-token-" + UUID.randomUUID()
            : null;
            
        // Gemini Live WebSocket Endpoint for v1beta BidiGenerateContent.
        // Currently used as a placeholder URL for future WebSocket integration.
        String webSocketUrl = isLive
            ? "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
            : null;
        OffsetDateTime expiresAt = isLive
            ? OffsetDateTime.now().plusSeconds(tokenTtlSeconds)
            : null;
        return new AiLiveSessionConfig(
            liveSessionId,
            ephemeralToken,
            model,
            buildSystemInstruction(topic, questions),
            isLive,
            expiresAt,
            webSocketUrl,
            responseLanguage,
            sessionDurationSeconds
        );
    }

    @Override
    public String buildSystemInstruction(AiConversationTopic topic, List<AiConversationQuestion> questions) {
        String questionList = questions.stream()
            .map(q -> "- " + q.questionText())
            .reduce("", (a, b) -> a + b + "\n");
        return """
            You are a gentle Vietnamese-speaking learning companion for a young child.
            Speak slowly, warmly, and simply.
            Ask only one question at a time from the provided question list.
            Do not create unrelated questions.
            Do not ask questions outside of the provided list.
            Do not mention disability, diagnosis, therapy, or developmental delay.
            After the child answers, wait for the backend evaluation result when available.
            If the answer is correct, praise briefly.
            If the answer is partially correct, encourage the child and ask them to try again gently.
            If the answer is unclear or incorrect, give one simple hint.
            Never criticize, shame, pressure, or compare the child.
            Keep every response short, positive, and emotionally safe.
            End the session with encouragement.

            Response language: %s
            Topic: %s
            Provided question list:
            %s
            """.formatted(responseLanguage, topic.title(), questionList);
    }

    @Override
    public void closeSession(String liveSessionId) {
        // TODO: When Gemini Live WebSocket transport is fully integrated,
        // close the upstream session here without changing callers.
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isConfigValid() {
        return !enabled || !apiKey.isBlank();
    }
}
