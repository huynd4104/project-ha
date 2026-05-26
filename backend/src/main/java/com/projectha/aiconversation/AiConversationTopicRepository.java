package com.projectha.aiconversation;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiConversationTopicRepository {
    private final JdbcTemplate jdbc;

    public AiConversationTopicRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<AiConversationTopic> findActive() {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_topics
            WHERE is_active = true
            ORDER BY sort_order, title
            """).stream().map(AiConversationMapper::topic).toList();
    }

    public List<AiConversationTopic> findAll() {
        return jdbc.queryForList("""
            SELECT * FROM ai_conversation_topics
            ORDER BY sort_order, title
            """).stream().map(AiConversationMapper::topic).toList();
    }

    public AiConversationTopic require(UUID id) {
        return jdbc.queryForList("SELECT * FROM ai_conversation_topics WHERE id = ?", id)
            .stream().findFirst().map(AiConversationMapper::topic)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chủ đề hội thoại AI."));
    }

    public AiConversationTopic create(Map<String, Object> payload) {
        return AiConversationMapper.topic(jdbc.queryForMap("""
            INSERT INTO ai_conversation_topics(
              code, title, description, age_range_min, age_range_max, difficulty_level,
              icon_name, mascot_reaction, estimated_duration_seconds, is_active, sort_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
            """,
            payload.get("code"),
            payload.get("title"),
            payload.getOrDefault("description", ""),
            payload.get("ageRangeMin"),
            payload.get("ageRangeMax"),
            payload.getOrDefault("difficultyLevel", "BEGINNER"),
            payload.getOrDefault("iconName", "chat_bubble"),
            payload.getOrDefault("mascotReaction", "welcome"),
            payload.getOrDefault("estimatedDurationSeconds", 180),
            payload.getOrDefault("isActive", true),
            payload.getOrDefault("sortOrder", 0)
        ));
    }

    public AiConversationTopic update(UUID id, Map<String, Object> payload) {
        require(id);
        return AiConversationMapper.topic(jdbc.queryForMap("""
            UPDATE ai_conversation_topics SET
              code = ?,
              title = ?,
              description = ?,
              age_range_min = ?,
              age_range_max = ?,
              difficulty_level = ?,
              icon_name = ?,
              mascot_reaction = ?,
              estimated_duration_seconds = ?,
              is_active = ?,
              sort_order = ?
            WHERE id = ?
            RETURNING *
            """,
            payload.get("code"),
            payload.get("title"),
            payload.getOrDefault("description", ""),
            payload.get("ageRangeMin"),
            payload.get("ageRangeMax"),
            payload.getOrDefault("difficultyLevel", "BEGINNER"),
            payload.getOrDefault("iconName", "chat_bubble"),
            payload.getOrDefault("mascotReaction", "welcome"),
            payload.getOrDefault("estimatedDurationSeconds", 180),
            payload.getOrDefault("isActive", true),
            payload.getOrDefault("sortOrder", 0),
            id
        ));
    }

    public AiConversationTopic setActive(UUID id, boolean active) {
        return AiConversationMapper.topic(jdbc.queryForMap(
            "UPDATE ai_conversation_topics SET is_active = ? WHERE id = ? RETURNING *",
            active,
            id
        ));
    }

    public void delete(UUID id) {
        jdbc.update("DELETE FROM ai_conversation_topics WHERE id = ?", id);
    }
}
