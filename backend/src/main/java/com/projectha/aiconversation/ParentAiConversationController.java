package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationDailyProgressResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationProgressOverviewResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationRecommendationResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationSessionDetailResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationSessionHistoryResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationTopicProgressResponse;
import com.projectha.child.ChildRepository;
import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/parent/children/{childId}/ai-conversations")
public class ParentAiConversationController {
    private final ChildRepository childRepository;
    private final AiConversationProgressService progressService;
    private final AiConversationService conversationService;

    public ParentAiConversationController(
        ChildRepository childRepository,
        AiConversationProgressService progressService,
        AiConversationService conversationService
    ) {
        this.childRepository = childRepository;
        this.progressService = progressService;
        this.conversationService = conversationService;
    }

    @GetMapping("/progress/overview")
    public ChildAiConversationProgressOverviewResponse overview(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        childRepository.requireOwned(principal.id(), childId);
        return progressService.overview(principal.id(), childId);
    }

    @GetMapping("/progress/daily")
    public List<ChildAiConversationDailyProgressResponse> daily(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        childRepository.requireOwned(principal.id(), childId);
        return progressService.dailyProgress(principal.id(), childId);
    }

    @GetMapping("/progress/topics")
    public List<ChildAiConversationTopicProgressResponse> topics(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        childRepository.requireOwned(principal.id(), childId);
        return progressService.topicProgress(principal.id(), childId);
    }

    @GetMapping("/sessions")
    public List<ChildAiConversationSessionHistoryResponse> sessions(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        return conversationService.history(principal.id(), childId);
    }

    @GetMapping("/sessions/{sessionId}")
    public ChildAiConversationSessionDetailResponse sessionDetail(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId,
        @PathVariable UUID sessionId
    ) {
        return conversationService.detail(principal.id(), childId, sessionId);
    }

    @GetMapping("/recommendations")
    public List<ChildAiConversationRecommendationResponse> recommendations(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        childRepository.requireOwned(principal.id(), childId);
        return progressService.recommendations(principal.id(), childId);
    }
}
