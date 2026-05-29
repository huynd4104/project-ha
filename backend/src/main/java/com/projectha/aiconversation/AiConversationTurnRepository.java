package com.projectha.aiconversation;

import com.projectha.common.Db;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationTurnRepository {
    private final JdbcTemplate jdbc;

    public AiConversationTurnRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AiConversationTurn create(
        UUID sessionId,
        AiConversationQuestion question,
        String childTranscript,
        AiConversationEvaluationOutcome outcome,
        boolean hintUsed,
        int attemptNo,
        String expectedAnswerResolved,
        List<String> acceptedKeywordsResolved
    ) {
        int turnOrder = nextTurnOrder(sessionId);
        return AiConversationMapper.turn(jdbc.queryForMap("""
            INSERT INTO ai_conversation_turns(
              session_id, question_id, turn_order, question_text, expected_answer_snapshot,
              accepted_keywords_snapshot, child_transcript, normalized_answer, evaluation_result,
              score, ai_feedback, hint_used, attempt_no, started_at, answered_at
            )
            VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), ?, ?, ?, ?, ?, ?, ?, now(), now())
            RETURNING *
            """,
            sessionId,
            question.id(),
            turnOrder,
            question.questionText(),
            expectedAnswerResolved != null ? expectedAnswerResolved : question.expectedAnswer(),
            Db.json(acceptedKeywordsResolved != null ? acceptedKeywordsResolved : question.acceptedKeywords()),
            childTranscript,
            outcome.normalizedAnswer(),
            outcome.result().name(),
            outcome.score(),
            outcome.feedback(),
            hintUsed,
            attemptNo
        ));
    }

    public List<AiConversationTurn> findBySession(UUID sessionId) {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_turns
            WHERE session_id = ?
            ORDER BY turn_order, created_at
            """, sessionId).stream().map(AiConversationMapper::turn).toList();
    }

    private int nextTurnOrder(UUID sessionId) {
        Integer value = jdbc.queryForObject(
            "SELECT COALESCE(MAX(turn_order), 0) + 1 FROM ai_conversation_turns WHERE session_id = ?",
            Integer.class,
            sessionId
        );
        return value == null ? 1 : value;
    }
}
