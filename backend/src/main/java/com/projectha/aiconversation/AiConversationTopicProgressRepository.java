package com.projectha.aiconversation;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationTopicProgressRepository {
    private final JdbcTemplate jdbc;

    public AiConversationTopicProgressRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void rebuildForTopic(UUID userId, UUID childId, UUID topicId) {
        jdbc.update("""
            INSERT INTO ai_conversation_topic_progress(
              user_id, child_id, topic_id, total_sessions, total_questions,
              total_correct, total_partially_correct, total_incorrect,
              average_score, last_practiced_at, needs_practice
            )
            SELECT
              s.user_id,
              s.child_id,
              s.topic_id,
              COUNT(*) FILTER (WHERE s.status = 'COMPLETED')::int AS total_sessions,
              COALESCE(SUM(s.answered_questions), 0)::int AS total_questions,
              COALESCE(SUM(s.correct_answers), 0)::int AS total_correct,
              COALESCE(SUM(s.partially_correct_answers), 0)::int AS total_partially_correct,
              COALESCE(SUM(s.incorrect_answers), 0)::int AS total_incorrect,
              COALESCE(ROUND(AVG(NULLIF(s.average_score, 0))::numeric, 2), 0) AS average_score,
              MAX(s.ended_at) AS last_practiced_at,
              (
                COALESCE(AVG(NULLIF(s.average_score, 0)), 0) < 0.65
                OR COALESCE(SUM(s.incorrect_answers), 0) > COALESCE(SUM(s.correct_answers + s.partially_correct_answers), 0)
              ) AS needs_practice
            FROM ai_conversation_sessions s
            WHERE s.user_id = ? AND s.child_id = ? AND s.topic_id = ? AND s.ended_at IS NOT NULL
            GROUP BY s.user_id, s.child_id, s.topic_id
            ON CONFLICT (child_id, topic_id)
            DO UPDATE SET
              total_sessions = EXCLUDED.total_sessions,
              total_questions = EXCLUDED.total_questions,
              total_correct = EXCLUDED.total_correct,
              total_partially_correct = EXCLUDED.total_partially_correct,
              total_incorrect = EXCLUDED.total_incorrect,
              average_score = EXCLUDED.average_score,
              last_practiced_at = EXCLUDED.last_practiced_at,
              needs_practice = EXCLUDED.needs_practice
            """, userId, childId, topicId);
    }

    public List<AiConversationTopicProgress> findByChild(UUID userId, UUID childId) {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_topic_progress
            WHERE user_id = ? AND child_id = ?
            ORDER BY needs_practice DESC, average_score ASC, last_practiced_at DESC NULLS LAST
            """, userId, childId).stream().map(AiConversationMapper::topicProgress).toList();
    }
}
