package com.projectha.aiconversation;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationSessionRepository {
    private final JdbcTemplate jdbc;

    public AiConversationSessionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AiConversationSession create(UUID userId, UUID childId, UUID topicId, int totalQuestions, String aiModel, String liveSessionId) {
        return AiConversationMapper.session(jdbc.queryForMap("""
            INSERT INTO ai_conversation_sessions(
              user_id, child_id, topic_id, status, started_at, total_questions, ai_model, live_session_id
            )
            VALUES (?, ?, ?, 'IN_PROGRESS', now(), ?, ?, ?)
            RETURNING *
            """, userId, childId, topicId, totalQuestions, aiModel, liveSessionId));
    }

    public AiConversationSession updateLiveSession(UUID sessionId, String liveSessionId) {
        return AiConversationMapper.session(jdbc.queryForMap(
            "UPDATE ai_conversation_sessions SET live_session_id = ? WHERE id = ? RETURNING *",
            liveSessionId,
            sessionId
        ));
    }

    public AiConversationSession requireOwned(UUID userId, UUID sessionId) {
        return jdbc.queryForList("SELECT * FROM ai_conversation_sessions WHERE id = ? AND user_id = ?", sessionId, userId)
            .stream().findFirst().map(AiConversationMapper::session)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy phiên hội thoại AI."));
    }

    public AiConversationSession requireForChild(UUID userId, UUID childId, UUID sessionId) {
        return jdbc.queryForList(
                "SELECT * FROM ai_conversation_sessions WHERE id = ? AND user_id = ? AND child_id = ?",
                sessionId,
                userId,
                childId
            )
            .stream().findFirst().map(AiConversationMapper::session)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy phiên hội thoại AI."));
    }

    public AiConversationSession complete(
        UUID sessionId,
        AiConversationSessionStatus status,
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
    ) {
        return AiConversationMapper.session(jdbc.queryForMap("""
            UPDATE ai_conversation_sessions SET
              status = ?,
              ended_at = now(),
              duration_seconds = ?,
              total_questions = ?,
              answered_questions = ?,
              correct_answers = ?,
              partially_correct_answers = ?,
              incorrect_answers = ?,
              needs_practice_count = ?,
              average_score = ?,
              summary_feedback = ?,
              parent_recommendation = ?
            WHERE id = ?
            RETURNING *
            """,
            status.name(),
            durationSeconds,
            totalQuestions,
            answeredQuestions,
            correctAnswers,
            partiallyCorrectAnswers,
            incorrectAnswers,
            needsPracticeCount,
            averageScore,
            summaryFeedback,
            parentRecommendation,
            sessionId
        ));
    }

    public List<Map<String, Object>> history(UUID userId, UUID childId) {
        return Db.rows(jdbc.queryForList("""
            SELECT s.*, t.title AS topic_title
            FROM ai_conversation_sessions s
            LEFT JOIN ai_conversation_topics t ON t.id = s.topic_id
            WHERE s.user_id = ? AND s.child_id = ?
            ORDER BY s.started_at DESC NULLS LAST, s.created_at DESC
            LIMIT 100
            """, userId, childId));
    }

    public Map<String, Object> summaryRow(UUID sessionId) {
        return jdbc.queryForList("""
            SELECT s.*, t.title AS topic_title
            FROM ai_conversation_sessions s
            LEFT JOIN ai_conversation_topics t ON t.id = s.topic_id
            WHERE s.id = ?
            """, sessionId).stream().findFirst().map(Db::row)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy phiên hội thoại AI."));
    }

    public int elapsedSeconds(AiConversationSession session) {
        OffsetDateTime startedAt = session.startedAt();
        if (startedAt == null) return session.durationSeconds();
        return Math.max(0, (int) java.time.Duration.between(startedAt, OffsetDateTime.now()).toSeconds());
    }
}
