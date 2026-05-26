package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationTopicResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationSessionSummaryResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationTopicResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationTurnDetailResponse;
import java.util.Map;
import java.util.UUID;

final class AiConversationDtoMapper {
    private AiConversationDtoMapper() {}

    static AiConversationTopicResponse topic(AiConversationTopic item) {
        return new AiConversationTopicResponse(
            item.id(),
            item.title(),
            item.description(),
            item.ageRangeMin(),
            item.ageRangeMax(),
            item.difficultyLevel(),
            item.iconName(),
            item.mascotReaction(),
            item.estimatedDurationSeconds(),
            item.isActive(),
            item.sortOrder()
        );
    }

    static AiConversationQuestionResponse question(AiConversationQuestion item) {
        return new AiConversationQuestionResponse(
            item.id(),
            item.topicId(),
            item.questionText(),
            item.questionAudioText(),
            item.evaluationType().name(),
            item.hintText(),
            item.maxAttempts(),
            item.difficultyLevel(),
            item.sortOrder()
        );
    }

    static AdminAiConversationTopicResponse adminTopic(AiConversationTopic item) {
        return new AdminAiConversationTopicResponse(
            item.id(),
            item.title(),
            item.description(),
            item.ageRangeMin(),
            item.ageRangeMax(),
            item.difficultyLevel(),
            item.iconName(),
            item.mascotReaction(),
            item.estimatedDurationSeconds(),
            item.isActive(),
            item.sortOrder(),
            item.createdAt(),
            item.updatedAt()
        );
    }

    static AdminAiConversationQuestionResponse adminQuestion(AiConversationQuestion item) {
        return new AdminAiConversationQuestionResponse(
            item.id(),
            item.topicId(),
            item.questionText(),
            item.questionAudioText(),
            item.expectedAnswer(),
            item.acceptedKeywords(),
            item.alternativeAnswers(),
            item.evaluationType().name(),
            item.hintText(),
            item.positiveFeedback(),
            item.retryFeedback(),
            item.maxAttempts(),
            item.difficultyLevel(),
            item.sortOrder(),
            item.isActive(),
            item.createdAt(),
            item.updatedAt()
        );
    }

    static AiConversationSessionSummaryResponse summary(Map<String, Object> row) {
        return new AiConversationSessionSummaryResponse(
            AiConversationMapper.uuid(row.get("id")),
            AiConversationMapper.nullableUuid(row.get("topicId")),
            AiConversationMapper.str(row.get("topicTitle"), "Chủ đề đã xóa"),
            AiConversationMapper.str(row.get("status")),
            AiConversationMapper.intValue(row.get("durationSeconds"), 0),
            AiConversationMapper.intValue(row.get("totalQuestions"), 0),
            AiConversationMapper.intValue(row.get("answeredQuestions"), 0),
            AiConversationMapper.intValue(row.get("correctAnswers"), 0),
            AiConversationMapper.intValue(row.get("partiallyCorrectAnswers"), 0),
            AiConversationMapper.intValue(row.get("incorrectAnswers"), 0),
            AiConversationMapper.intValue(row.get("needsPracticeCount"), 0),
            AiConversationMapper.doubleValue(row.get("averageScore"), 0),
            AiConversationMapper.str(row.get("summaryFeedback")),
            AiConversationMapper.str(row.get("parentRecommendation"))
        );
    }

    static AiConversationTurnDetailResponse turnDetail(AiConversationTurn turn, boolean transcriptVisible) {
        String transcript = transcriptVisible
            ? turn.childTranscript()
            : (turn.childTranscript() == null || turn.childTranscript().isBlank() ? null : "Đã ẩn để bảo vệ quyền riêng tư");
        UUID questionId = turn.questionId();
        return new AiConversationTurnDetailResponse(
            turn.id(),
            questionId,
            turn.turnOrder(),
            turn.questionText(),
            transcript,
            turn.evaluationResult().name(),
            turn.score(),
            turn.aiFeedback(),
            turn.hintUsed(),
            turn.attemptNo(),
            turn.answeredAt()
        );
    }
}
