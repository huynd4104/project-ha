package com.projectha.aiconversation;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class AiConversationDtos {
    private AiConversationDtos() {}

    public record AiConversationTopicResponse(
        UUID id,
        String title,
        String description,
        Integer ageRangeMin,
        Integer ageRangeMax,
        String difficultyLevel,
        String iconName,
        String mascotReaction,
        int estimatedDurationSeconds,
        boolean isActive,
        int sortOrder
    ) {}

    public record AiConversationQuestionResponse(
        UUID id,
        UUID topicId,
        String questionText,
        String questionAudioText,
        String evaluationType,
        String hintText,
        int maxAttempts,
        String difficultyLevel,
        int sortOrder
    ) {}

    public record StartAiConversationSessionRequest(UUID childId, UUID topicId) {}

    public record StartAiConversationSessionResponse(
        UUID sessionId,
        UUID topicId,
        String liveSessionId,
        String ephemeralToken,
        String model,
        String systemInstruction,
        List<AiConversationQuestionResponse> questionList,
        int maxDurationSeconds,
        String mode,
        boolean isRealGeminiLive
    ) {}

    public record SubmitAiConversationTurnRequest(
        UUID questionId,
        String childTranscript,
        Boolean hintUsed,
        Integer attemptNo
    ) {}

    public record SubmitAiConversationTurnResponse(
        UUID turnId,
        UUID sessionId,
        UUID questionId,
        String evaluationResult,
        double score,
        String aiFeedback,
        String nextAction
    ) {}

    public record CompleteAiConversationSessionRequest(String reason) {}

    public record AiConversationSessionSummaryResponse(
        UUID sessionId,
        UUID topicId,
        String topicTitle,
        String status,
        int durationSeconds,
        int totalQuestions,
        int answeredQuestions,
        int correctAnswers,
        int partiallyCorrectAnswers,
        int incorrectAnswers,
        int needsPracticeCount,
        double averageScore,
        String summaryFeedback,
        String parentRecommendation
    ) {}

    public record ChildAiConversationProgressOverviewResponse(
        int completedSessions,
        int totalDurationSeconds,
        int totalAnsweredQuestions,
        double positiveResponseRate,
        List<String> strongTopics,
        List<String> needsPracticeTopics
    ) {}

    public record ChildAiConversationDailyProgressResponse(
        LocalDate progressDate,
        int totalSessions,
        int completedSessions,
        int totalDurationSeconds,
        int totalQuestions,
        int totalCorrect,
        int totalPartiallyCorrect,
        int totalIncorrect,
        double averageScore
    ) {}

    public record ChildAiConversationTopicProgressResponse(
        UUID topicId,
        String topicTitle,
        int totalSessions,
        int totalQuestions,
        int totalCorrect,
        int totalPartiallyCorrect,
        int totalIncorrect,
        double averageScore,
        OffsetDateTime lastPracticedAt,
        boolean needsPractice
    ) {}

    public record ChildAiConversationSessionHistoryResponse(
        UUID sessionId,
        UUID topicId,
        String topicTitle,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt,
        int durationSeconds,
        int answeredQuestions,
        int correctAnswers,
        int partiallyCorrectAnswers,
        int incorrectAnswers,
        double averageScore,
        String summaryFeedback
    ) {}

    public record ChildAiConversationSessionDetailResponse(
        AiConversationSessionSummaryResponse summary,
        List<AiConversationTurnDetailResponse> turns,
        boolean transcriptVisible
    ) {}

    public record AiConversationTurnDetailResponse(
        UUID id,
        UUID questionId,
        int turnOrder,
        String questionText,
        String childTranscript,
        String evaluationResult,
        double score,
        String aiFeedback,
        boolean hintUsed,
        int attemptNo,
        OffsetDateTime answeredAt
    ) {}

    public record ChildAiConversationRecommendationResponse(
        String title,
        String message,
        UUID topicId,
        String topicTitle
    ) {}

    public record AdminAiConversationTopicRequest(
        String title,
        String description,
        Integer ageRangeMin,
        Integer ageRangeMax,
        String difficultyLevel,
        String iconName,
        String mascotReaction,
        Integer estimatedDurationSeconds,
        Boolean isActive,
        Integer sortOrder
    ) {}

    public record AdminAiConversationTopicResponse(
        UUID id,
        String title,
        String description,
        Integer ageRangeMin,
        Integer ageRangeMax,
        String difficultyLevel,
        String iconName,
        String mascotReaction,
        int estimatedDurationSeconds,
        boolean isActive,
        int sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public record AdminAiConversationQuestionRequest(
        String questionText,
        String questionAudioText,
        String expectedAnswer,
        List<String> acceptedKeywords,
        List<String> alternativeAnswers,
        String evaluationType,
        String hintText,
        String positiveFeedback,
        String retryFeedback,
        Integer maxAttempts,
        String difficultyLevel,
        Integer sortOrder,
        Boolean isActive
    ) {}

    public record AdminAiConversationQuestionResponse(
        UUID id,
        UUID topicId,
        String questionText,
        String questionAudioText,
        String expectedAnswer,
        List<String> acceptedKeywords,
        List<String> alternativeAnswers,
        String evaluationType,
        String hintText,
        String positiveFeedback,
        String retryFeedback,
        int maxAttempts,
        String difficultyLevel,
        int sortOrder,
        boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public record AiLiveTokenResponse(
        UUID sessionId,
        String provider,
        String model,
        String ephemeralToken,
        OffsetDateTime expiresAt,
        String webSocketUrl,
        String systemInstruction,
        String responseLanguage,
        int maxDurationSeconds,
        List<AiConversationQuestionResponse> questions,
        String mode,
        boolean isRealGeminiLive
    ) {}

    public record ActiveFlagRequest(Boolean active, Boolean isActive) {
        public boolean value() {
            return isActive != null ? isActive : Boolean.TRUE.equals(active);
        }
    }
}
