package com.projectha.aiconversation;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiLiveSessionService {
    private final AiLiveConversationProvider provider;

    public AiLiveSessionService(AiLiveConversationProvider provider) {
        this.provider = provider;
    }

    public AiLiveSessionConfig createLiveSession(AiConversationSession session, AiConversationTopic topic, List<AiConversationQuestion> questions) {
        return provider.createLiveSession(session, topic, questions);
    }

    public AiLiveSessionConfig generateLiveToken(AiConversationSession session, AiConversationTopic topic, List<AiConversationQuestion> questions) {
        return provider.createLiveSession(session, topic, questions);
    }

    public void closeSession(String liveSessionId) {
        if (liveSessionId != null && !liveSessionId.isBlank()) {
            provider.closeSession(liveSessionId);
        }
    }
}
