package com.projectha.aiconversation;

import java.util.List;
import java.util.UUID;

public class MockAiLiveConversationProvider implements AiLiveConversationProvider {
    @Override
    public AiLiveSessionConfig createLiveSession(AiConversationSession session, AiConversationTopic topic, List<AiConversationQuestion> questions) {
        return new AiLiveSessionConfig(
            "mock-live-" + UUID.randomUUID(),
            null,
            "mock-ai-live",
            buildSystemInstruction(topic, questions),
            false,
            null,
            null,
            "vi-VN",
            180
        );
    }

    @Override
    public String buildSystemInstruction(AiConversationTopic topic, List<AiConversationQuestion> questions) {
        return "Mock AI conversation session for topic: " + topic.title();
    }

    @Override
    public void closeSession(String liveSessionId) {
    }
}
