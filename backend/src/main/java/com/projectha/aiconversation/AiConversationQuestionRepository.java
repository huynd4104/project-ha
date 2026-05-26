package com.projectha.aiconversation;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationQuestionRepository {
    private final JdbcTemplate jdbc;

    public AiConversationQuestionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<AiConversationQuestion> findActiveByTopic(UUID topicId) {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_questions
            WHERE topic_id = ? AND is_active = true
            ORDER BY sort_order, question_text
            """, topicId).stream().map(AiConversationMapper::question).toList();
    }

    public List<AiConversationQuestion> findAllByTopic(UUID topicId) {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_questions
            WHERE topic_id = ?
            ORDER BY sort_order, question_text
            """, topicId).stream().map(AiConversationMapper::question).toList();
    }

    public AiConversationQuestion require(UUID id) {
        return jdbc.queryForList("SELECT * FROM ai_conversation_questions WHERE id = ?", id)
            .stream().findFirst().map(AiConversationMapper::question)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy câu hỏi hội thoại AI."));
    }

    public AiConversationQuestion create(UUID topicId, Map<String, Object> payload) {
        return AiConversationMapper.question(jdbc.queryForMap("""
            INSERT INTO ai_conversation_questions(
              topic_id, question_text, question_audio_text, expected_answer,
              accepted_keywords, alternative_answers, evaluation_type, hint_text,
              positive_feedback, retry_feedback, max_attempts,
              difficulty_level, sort_order, is_active
            )
            VALUES (?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
            """,
            topicId,
            payload.get("questionText"),
            payload.getOrDefault("questionAudioText", ""),
            payload.getOrDefault("expectedAnswer", ""),
            Db.json(payload.getOrDefault("acceptedKeywords", List.of())),
            Db.json(payload.getOrDefault("alternativeAnswers", List.of())),
            payload.getOrDefault("evaluationType", "KEYWORD"),
            payload.getOrDefault("hintText", ""),
            payload.getOrDefault("positiveFeedback", ""),
            payload.getOrDefault("retryFeedback", ""),
            payload.getOrDefault("maxAttempts", 2),
            payload.getOrDefault("difficultyLevel", "BEGINNER"),
            payload.getOrDefault("sortOrder", 0),
            payload.getOrDefault("isActive", true)
        ));
    }

    public AiConversationQuestion update(UUID id, Map<String, Object> payload) {
        require(id);
        return AiConversationMapper.question(jdbc.queryForMap("""
            UPDATE ai_conversation_questions SET
              question_text = ?,
              question_audio_text = ?,
              expected_answer = ?,
              accepted_keywords = CAST(? AS jsonb),
              alternative_answers = CAST(? AS jsonb),
              evaluation_type = ?,
              hint_text = ?,
              positive_feedback = ?,
              retry_feedback = ?,
              max_attempts = ?,
              difficulty_level = ?,
              sort_order = ?,
              is_active = ?
            WHERE id = ?
            RETURNING *
            """,
            payload.get("questionText"),
            payload.getOrDefault("questionAudioText", ""),
            payload.getOrDefault("expectedAnswer", ""),
            Db.json(payload.getOrDefault("acceptedKeywords", List.of())),
            Db.json(payload.getOrDefault("alternativeAnswers", List.of())),
            payload.getOrDefault("evaluationType", "KEYWORD"),
            payload.getOrDefault("hintText", ""),
            payload.getOrDefault("positiveFeedback", ""),
            payload.getOrDefault("retryFeedback", ""),
            payload.getOrDefault("maxAttempts", 2),
            payload.getOrDefault("difficultyLevel", "BEGINNER"),
            payload.getOrDefault("sortOrder", 0),
            payload.getOrDefault("isActive", true),
            id
        ));
    }

    public AiConversationQuestion setActive(UUID id, boolean active) {
        return AiConversationMapper.question(jdbc.queryForMap(
            "UPDATE ai_conversation_questions SET is_active = ? WHERE id = ? RETURNING *",
            active,
            id
        ));
    }

    public void delete(UUID id) {
        jdbc.update("DELETE FROM ai_conversation_questions WHERE id = ?", id);
    }
}
