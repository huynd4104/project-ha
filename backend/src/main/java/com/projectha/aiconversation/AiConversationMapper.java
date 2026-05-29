package com.projectha.aiconversation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.projectha.common.Db;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

final class AiConversationMapper {
    private AiConversationMapper() {}

    static AiConversationTopic topic(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationTopic(
            uuid(row.get("id")),
            str(row.get("title")),
            str(row.get("description")),
            nullableInt(row.get("ageRangeMin")),
            nullableInt(row.get("ageRangeMax")),
            str(row.get("difficultyLevel"), "BEGINNER"),
            str(row.get("iconName"), "chat_bubble"),
            str(row.get("mascotReaction"), "welcome"),
            intValue(row.get("estimatedDurationSeconds"), 180),
            bool(row.get("isActive"), true),
            offset(row.get("createdAt")),
            offset(row.get("updatedAt"))
        );
    }

    static AiConversationQuestion question(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationQuestion(
            uuid(row.get("id")),
            uuid(row.get("topicId")),
            str(row.get("questionText")),
            str(row.get("questionAudioText")),
            str(row.get("expectedAnswer")),
            strings(row.get("acceptedKeywords")),
            strings(row.get("alternativeAnswers")),
            enumValue(AiConversationEvaluationType.class, row.get("evaluationType"), AiConversationEvaluationType.KEYWORD),
            enumValue(AiConversationAdvancePolicy.class, row.get("advancePolicy"), AiConversationAdvancePolicy.ON_CORRECT_ONLY),
            bool(row.get("allowSkip"), true),
            nullableInt(row.get("skipAfterAttempts")),
            str(row.get("retryPromptText")),
            str(row.get("correctFeedback")),
            str(row.get("retryFeedback")),
            str(row.get("hintText")),
            str(row.get("positiveFeedback")),
            str(row.get("difficultyLevel"), "BEGINNER"),
            intValue(row.get("maxAttempts"), 2),
            bool(row.get("isActive"), true),
            offset(row.get("createdAt")),
            offset(row.get("updatedAt"))
        );
    }

    static AiConversationSession session(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationSession(
            uuid(row.get("id")),
            uuid(row.get("userId")),
            uuid(row.get("childId")),
            nullableUuid(row.get("topicId")),
            enumValue(AiConversationSessionStatus.class, row.get("status"), AiConversationSessionStatus.CREATED),
            offset(row.get("startedAt")),
            offset(row.get("endedAt")),
            intValue(row.get("durationSeconds"), 0),
            intValue(row.get("totalQuestions"), 0),
            intValue(row.get("answeredQuestions"), 0),
            intValue(row.get("correctAnswers"), 0),
            intValue(row.get("partiallyCorrectAnswers"), 0),
            intValue(row.get("incorrectAnswers"), 0),
            intValue(row.get("needsPracticeCount"), 0),
            doubleValue(row.get("averageScore"), 0),
            str(row.get("aiModel")),
            str(row.get("liveSessionId")),
            str(row.get("summaryFeedback")),
            str(row.get("parentRecommendation")),
            offset(row.get("createdAt")),
            offset(row.get("updatedAt"))
        );
    }

    static AiConversationTurn turn(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationTurn(
            uuid(row.get("id")),
            uuid(row.get("sessionId")),
            nullableUuid(row.get("questionId")),
            intValue(row.get("turnOrder"), 0),
            str(row.get("questionText")),
            str(row.get("expectedAnswerSnapshot")),
            strings(row.get("acceptedKeywordsSnapshot")),
            nullableString(row.get("childTranscript")),
            str(row.get("normalizedAnswer")),
            enumValue(AiConversationEvaluationResult.class, row.get("evaluationResult"), AiConversationEvaluationResult.UNCLEAR),
            doubleValue(row.get("score"), 0),
            str(row.get("aiFeedback")),
            bool(row.get("hintUsed"), false),
            intValue(row.get("attemptNo"), 1),
            offset(row.get("startedAt")),
            offset(row.get("answeredAt")),
            offset(row.get("createdAt"))
        );
    }

    static AiConversationProgressDaily daily(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationProgressDaily(
            uuid(row.get("id")),
            uuid(row.get("userId")),
            uuid(row.get("childId")),
            localDate(row.get("progressDate")),
            intValue(row.get("totalSessions"), 0),
            intValue(row.get("completedSessions"), 0),
            intValue(row.get("totalDurationSeconds"), 0),
            intValue(row.get("totalQuestions"), 0),
            intValue(row.get("totalCorrect"), 0),
            intValue(row.get("totalPartiallyCorrect"), 0),
            intValue(row.get("totalIncorrect"), 0),
            doubleValue(row.get("averageScore"), 0),
            offset(row.get("createdAt")),
            offset(row.get("updatedAt"))
        );
    }

    static AiConversationTopicProgress topicProgress(Map<String, Object> raw) {
        Map<String, Object> row = Db.row(raw);
        return new AiConversationTopicProgress(
            uuid(row.get("id")),
            uuid(row.get("userId")),
            uuid(row.get("childId")),
            uuid(row.get("topicId")),
            intValue(row.get("totalSessions"), 0),
            intValue(row.get("totalQuestions"), 0),
            intValue(row.get("totalCorrect"), 0),
            intValue(row.get("totalPartiallyCorrect"), 0),
            intValue(row.get("totalIncorrect"), 0),
            doubleValue(row.get("averageScore"), 0),
            offset(row.get("lastPracticedAt")),
            bool(row.get("needsPractice"), false),
            offset(row.get("createdAt")),
            offset(row.get("updatedAt"))
        );
    }

    static UUID uuid(Object value) {
        if (value instanceof UUID uuid) return uuid;
        return UUID.fromString(String.valueOf(value));
    }

    static UUID nullableUuid(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return uuid(value);
    }

    static String str(Object value) {
        return str(value, "");
    }

    static String str(Object value, String fallback) {
        if (value == null) return fallback;
        return String.valueOf(value);
    }

    static String nullableString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    static int intValue(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        try {
            return value == null || String.valueOf(value).isBlank() ? fallback : Integer.parseInt(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    static Integer nullableInt(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return intValue(value, 0);
    }

    static double doubleValue(Object value, double fallback) {
        if (value instanceof BigDecimal d) return d.doubleValue();
        if (value instanceof Number n) return n.doubleValue();
        try {
            return value == null || String.valueOf(value).isBlank() ? fallback : Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    static boolean bool(Object value, boolean fallback) {
        if (value instanceof Boolean b) return b;
        if (value == null) return fallback;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    static OffsetDateTime offset(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        if (value instanceof OffsetDateTime odt) return odt;
        if (value instanceof Timestamp ts) return ts.toInstant().atOffset(ZoneOffset.UTC);
        return OffsetDateTime.parse(String.valueOf(value));
    }

    static LocalDate localDate(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        if (value instanceof LocalDate date) return date;
        if (value instanceof Date date) return date.toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    static List<String> strings(Object value) {
        if (value == null) return List.of();
        if (value instanceof List<?> list) return list.stream().map(String::valueOf).toList();
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return List.of();
        if (text.startsWith("[")) return Db.fromJson(text, new TypeReference<List<String>>() {});
        return List.of(text);
    }

    static <T extends Enum<T>> T enumValue(Class<T> type, Object value, T fallback) {
        if (value == null) return fallback;
        try {
            return Enum.valueOf(type, String.valueOf(value).toUpperCase());
        } catch (Exception e) {
            return fallback;
        }
    }
}
