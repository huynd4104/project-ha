package com.projectha.child;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChildRepository {
    private final JdbcTemplate jdbc;

    public ChildRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> list(UUID userId) {
        return Db.rows(jdbc.queryForList("SELECT * FROM children WHERE user_id = ? ORDER BY created_at", userId));
    }

    public Map<String, Object> requireOwned(UUID userId, UUID childId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM children WHERE id = ? AND user_id = ?",
            childId, userId
        );
        return rows.stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("Hồ sơ trẻ không thuộc tài khoản này."));
    }

    public Map<String, Object> create(UUID userId, Map<String, Object> payload) {
        String name = str(payload, "displayName", str(payload, "name", ""));
        return Db.row(jdbc.queryForMap("""
            INSERT INTO children(
              user_id, display_name, name, age, gender, note, primary_difficulty,
              secondary_difficulties, learning_goals, support_level, daily_duration_minutes,
              co_learning_mode, interests, accessibility_preferences, avatar_url, avatar_object_key
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb), ?, ?)
            RETURNING *
            """,
            userId,
            name,
            name,
            number(payload.get("age"), 0),
            str(payload, "gender", ""),
            str(payload, "note", ""),
            str(payload, "primaryDifficulty", "OTHER"),
            Db.json(payload.getOrDefault("secondaryDifficulties", List.of())),
            Db.json(payload.getOrDefault("learningGoals", List.of())),
            str(payload, "supportLevel", "MEDIUM"),
            number(payload.get("dailyDurationMinutes"), 5),
            str(payload, "coLearningMode", "PARENT_CHILD_TOGETHER"),
            Db.json(payload.getOrDefault("interests", List.of())),
            Db.json(payload.getOrDefault("accessibilityPreferences", Map.of())),
            str(payload, "avatarUrl", str(payload, "avatar_url", "")),
            str(payload, "avatarObjectKey", str(payload, "avatar_object_key", ""))
        ));
    }

    public Map<String, Object> update(UUID userId, UUID childId, Map<String, Object> payload) {
        requireOwned(userId, childId);
        String name = str(payload, "displayName", str(payload, "name", ""));
        return Db.row(jdbc.queryForMap("""
            UPDATE children SET
              display_name = COALESCE(NULLIF(?, ''), display_name),
              name = COALESCE(NULLIF(?, ''), name),
              age = ?,
              gender = ?,
              note = ?,
              primary_difficulty = ?,
              secondary_difficulties = CAST(? AS jsonb),
              learning_goals = CAST(? AS jsonb),
              support_level = ?,
              daily_duration_minutes = ?,
              co_learning_mode = ?,
              interests = CAST(? AS jsonb),
              accessibility_preferences = CAST(? AS jsonb),
              current_program_id = COALESCE(CAST(NULLIF(?, '') AS uuid), current_program_id),
              current_path_id = COALESCE(CAST(NULLIF(?, '') AS uuid), current_path_id),
              selected_at = COALESCE(CAST(NULLIF(?, '') AS timestamptz), selected_at),
              avatar_url = ?,
              avatar_object_key = ?
            WHERE id = ? AND user_id = ?
            RETURNING *
            """,
            name,
            name,
            number(payload.get("age"), 0),
            str(payload, "gender", ""),
            str(payload, "note", ""),
            str(payload, "primaryDifficulty", "OTHER"),
            Db.json(payload.getOrDefault("secondaryDifficulties", List.of())),
            Db.json(payload.getOrDefault("learningGoals", List.of())),
            str(payload, "supportLevel", "MEDIUM"),
            number(payload.get("dailyDurationMinutes"), 5),
            str(payload, "coLearningMode", "PARENT_CHILD_TOGETHER"),
            Db.json(payload.getOrDefault("interests", List.of())),
            Db.json(payload.getOrDefault("accessibilityPreferences", Map.of())),
            str(payload, "currentProgramId", ""),
            str(payload, "currentPathId", ""),
            str(payload, "selectedAt", ""),
            str(payload, "avatarUrl", str(payload, "avatar_url", "")),
            str(payload, "avatarObjectKey", str(payload, "avatar_object_key", "")),
            childId,
            userId
        ));
    }

    public Map<String, Object> saveCurrentPath(UUID userId, UUID childId, UUID programId, UUID pathId) {
        requireOwned(userId, childId);
        return Db.row(jdbc.queryForMap("""
            UPDATE children
            SET current_program_id = ?, current_path_id = ?, selected_at = now()
            WHERE id = ? AND user_id = ?
            RETURNING *
            """, programId, pathId, childId, userId));
    }

    public void updateAvatar(UUID userId, UUID childId, String avatarUrl, String avatarObjectKey) {
        jdbc.update(
            "UPDATE children SET avatar_url = ?, avatar_object_key = ? WHERE id = ? AND user_id = ?",
            avatarUrl, avatarObjectKey, childId, userId
        );
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null ? fallback : String.valueOf(value).trim();
    }

    private static int number(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        try {
            return value == null ? fallback : Integer.parseInt(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }
}
