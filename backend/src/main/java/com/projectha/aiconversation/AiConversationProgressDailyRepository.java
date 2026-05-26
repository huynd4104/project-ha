package com.projectha.aiconversation;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationProgressDailyRepository {
    private final JdbcTemplate jdbc;

    public AiConversationProgressDailyRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void rebuildForDate(UUID userId, UUID childId, LocalDate date) {
        jdbc.update("""
            INSERT INTO ai_conversation_progress_daily(
              user_id, child_id, progress_date, total_sessions, completed_sessions,
              total_duration_seconds, total_questions, total_correct,
              total_partially_correct, total_incorrect, average_score
            )
            SELECT
              s.user_id,
              s.child_id,
              CAST(s.ended_at AS date) AS progress_date,
              COUNT(*)::int AS total_sessions,
              COUNT(*) FILTER (WHERE s.status = 'COMPLETED')::int AS completed_sessions,
              COALESCE(SUM(s.duration_seconds), 0)::int AS total_duration_seconds,
              COALESCE(SUM(s.answered_questions), 0)::int AS total_questions,
              COALESCE(SUM(s.correct_answers), 0)::int AS total_correct,
              COALESCE(SUM(s.partially_correct_answers), 0)::int AS total_partially_correct,
              COALESCE(SUM(s.incorrect_answers), 0)::int AS total_incorrect,
              COALESCE(ROUND(AVG(NULLIF(s.average_score, 0))::numeric, 2), 0) AS average_score
            FROM ai_conversation_sessions s
            WHERE s.user_id = ? AND s.child_id = ? AND s.ended_at IS NOT NULL AND CAST(s.ended_at AS date) = ?
            GROUP BY s.user_id, s.child_id, CAST(s.ended_at AS date)
            ON CONFLICT (child_id, progress_date)
            DO UPDATE SET
              total_sessions = EXCLUDED.total_sessions,
              completed_sessions = EXCLUDED.completed_sessions,
              total_duration_seconds = EXCLUDED.total_duration_seconds,
              total_questions = EXCLUDED.total_questions,
              total_correct = EXCLUDED.total_correct,
              total_partially_correct = EXCLUDED.total_partially_correct,
              total_incorrect = EXCLUDED.total_incorrect,
              average_score = EXCLUDED.average_score
            """, userId, childId, date);
    }

    public List<AiConversationProgressDaily> findByChild(UUID userId, UUID childId) {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_progress_daily
            WHERE user_id = ? AND child_id = ?
            ORDER BY progress_date DESC
            LIMIT 30
            """, userId, childId).stream().map(AiConversationMapper::daily).toList();
    }
}
