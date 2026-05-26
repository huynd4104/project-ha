package com.projectha.aiconversation;

import java.util.List;

public interface AiLiveConversationProvider {
    AiLiveSessionConfig createLiveSession(AiConversationSession session, AiConversationTopic topic, List<AiConversationQuestion> questions);

    String buildSystemInstruction(AiConversationTopic topic, List<AiConversationQuestion> questions);

    void closeSession(String liveSessionId);
}
