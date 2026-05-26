package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.AiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationSessionSummaryResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationTopicResponse;
import com.projectha.aiconversation.AiConversationDtos.AiLiveTokenResponse;
import com.projectha.aiconversation.AiConversationDtos.CompleteAiConversationSessionRequest;
import com.projectha.aiconversation.AiConversationDtos.StartAiConversationSessionRequest;
import com.projectha.aiconversation.AiConversationDtos.StartAiConversationSessionResponse;
import com.projectha.aiconversation.AiConversationDtos.SubmitAiConversationTurnRequest;
import com.projectha.aiconversation.AiConversationDtos.SubmitAiConversationTurnResponse;
import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-conversations")
public class AiConversationController {
    private final AiConversationService service;

    public AiConversationController(AiConversationService service) {
        this.service = service;
    }

    @GetMapping("/topics")
    public List<AiConversationTopicResponse> topics() {
        return service.topics();
    }

    @GetMapping("/topics/{topicId}/questions")
    public List<AiConversationQuestionResponse> questions(@PathVariable UUID topicId) {
        return service.questions(topicId);
    }

    @PostMapping("/sessions/start")
    public StartAiConversationSessionResponse start(
        @AuthenticationPrincipal AuthPrincipal principal,
        @RequestBody StartAiConversationSessionRequest request
    ) {
        return service.start(principal.id(), request);
    }

    @PostMapping("/sessions/{sessionId}/live-token")
    public AiLiveTokenResponse liveToken(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID sessionId
    ) {
        return service.liveToken(principal.id(), sessionId);
    }

    @PostMapping("/sessions/{sessionId}/turns")
    public SubmitAiConversationTurnResponse turn(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID sessionId,
        @RequestBody SubmitAiConversationTurnRequest request
    ) {
        return service.submitTurn(principal.id(), sessionId, request);
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public AiConversationSessionSummaryResponse complete(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID sessionId,
        @RequestBody(required = false) CompleteAiConversationSessionRequest request
    ) {
        return service.complete(principal.id(), sessionId, request == null ? new CompleteAiConversationSessionRequest("completed") : request);
    }

    @GetMapping("/sessions/{sessionId}/summary")
    public AiConversationSessionSummaryResponse summary(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID sessionId
    ) {
        return service.summary(principal.id(), sessionId);
    }
}
