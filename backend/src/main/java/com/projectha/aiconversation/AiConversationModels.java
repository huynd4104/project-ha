package com.projectha.aiconversation;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

enum AiConversationEvaluationType {
    EXACT,
    KEYWORD,
    SEMANTIC,
    OPEN_ENDED
}

enum AiConversationSessionStatus {
    CREATED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    EXPIRED
}

enum AiConversationEvaluationResult {
    CORRECT,
    PARTIALLY_CORRECT,
    INCORRECT,
    UNCLEAR,
    SKIPPED
}

record AiConversationTopic(
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

record AiConversationQuestion(
    UUID id,
    UUID topicId,
    String questionText,
    String questionAudioText,
    String expectedAnswer,
    List<String> acceptedKeywords,
    List<String> alternativeAnswers,
    AiConversationEvaluationType evaluationType,
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

record AiConversationSession(
    UUID id,
    UUID userId,
    UUID childId,
    UUID topicId,
    AiConversationSessionStatus status,
    OffsetDateTime startedAt,
    OffsetDateTime endedAt,
    int durationSeconds,
    int totalQuestions,
    int answeredQuestions,
    int correctAnswers,
    int partiallyCorrectAnswers,
    int incorrectAnswers,
    int needsPracticeCount,
    double averageScore,
    String aiModel,
    String liveSessionId,
    String summaryFeedback,
    String parentRecommendation,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

record AiConversationTurn(
    UUID id,
    UUID sessionId,
    UUID questionId,
    int turnOrder,
    String questionText,
    String expectedAnswerSnapshot,
    List<String> acceptedKeywordsSnapshot,
    String childTranscript,
    String normalizedAnswer,
    AiConversationEvaluationResult evaluationResult,
    double score,
    String aiFeedback,
    boolean hintUsed,
    int attemptNo,
    OffsetDateTime startedAt,
    OffsetDateTime answeredAt,
    OffsetDateTime createdAt
) {}

record AiConversationProgressDaily(
    UUID id,
    UUID userId,
    UUID childId,
    LocalDate progressDate,
    int totalSessions,
    int completedSessions,
    int totalDurationSeconds,
    int totalQuestions,
    int totalCorrect,
    int totalPartiallyCorrect,
    int totalIncorrect,
    double averageScore,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

record AiConversationTopicProgress(
    UUID id,
    UUID userId,
    UUID childId,
    UUID topicId,
    int totalSessions,
    int totalQuestions,
    int totalCorrect,
    int totalPartiallyCorrect,
    int totalIncorrect,
    double averageScore,
    OffsetDateTime lastPracticedAt,
    boolean needsPractice,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}

record AiConversationEvaluationOutcome(
    AiConversationEvaluationResult result,
    double score,
    String normalizedAnswer,
    String feedback,
    boolean needsPractice
) {}

record AiLiveSessionConfig(
    String liveSessionId,
    String ephemeralToken,
    String model,
    String systemInstruction,
    boolean enabled,
    OffsetDateTime expiresAt,
    String webSocketUrl,
    String responseLanguage,
    int maxDurationSeconds
) {}
