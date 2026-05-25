package com.projectha.learning;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LearningRepository {
    private final JdbcTemplate jdbc;

    public LearningRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> publishedPrograms() {
        return Db.rows(jdbc.queryForList("SELECT * FROM programs WHERE status = 'PUBLISHED' AND is_active = true ORDER BY sort_order, title"));
    }

    public List<Map<String, Object>> publishedPaths() {
        return Db.rows(jdbc.queryForList("SELECT * FROM learning_paths WHERE status = 'PUBLISHED' AND is_active = true ORDER BY title"));
    }

    public Map<String, Object> goalSkillTags() {
        return Map.of();
    }

    public Optional<Map<String, Object>> child(UUID userId, UUID childId) {
        return jdbc.queryForList("SELECT * FROM children WHERE id = ? AND user_id = ?", childId, userId)
            .stream().findFirst().map(Db::row);
    }

    public Optional<Map<String, Object>> path(UUID pathId) {
        return jdbc.queryForList("SELECT * FROM learning_paths WHERE id = ?", pathId).stream().findFirst().map(Db::row);
    }

    public Optional<Map<String, Object>> program(UUID programId) {
        return jdbc.queryForList("SELECT * FROM programs WHERE id = ?", programId).stream().findFirst().map(Db::row);
    }

    public List<Map<String, Object>> pathItems(UUID pathId) {
        return Db.rows(jdbc.queryForList("SELECT * FROM path_items WHERE path_id = ? AND is_active = true ORDER BY sequence", pathId));
    }

    public List<Map<String, Object>> lessonsForPath(UUID pathId) {
        return Db.rows(jdbc.queryForList("""
            SELECT l.*
            FROM path_items pi
            JOIN lessons l ON l.id = pi.lesson_id
            WHERE pi.path_id = ? AND pi.is_active = true AND l.is_active = true
            ORDER BY pi.sequence
            """, pathId));
    }

    public List<Map<String, Object>> legacyLessons() {
        return Db.rows(jdbc.queryForList("SELECT * FROM lessons WHERE is_active = true ORDER BY title"));
    }

    public Map<String, Object> lesson(UUID lessonId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM lessons WHERE id = ?", lessonId);
        Map<String, Object> lesson = rows.stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("Bài học không tồn tại."));
        Object npcId = lesson.get("npcId");
        if (npcId != null) {
            jdbc.queryForList("SELECT * FROM npcs WHERE id = CAST(? AS uuid)", npcId)
                .stream().findFirst().map(Db::row).ifPresent(npc -> lesson.put("npc", npc));
        }
        return lesson;
    }

    public List<Map<String, Object>> byLesson(String table, UUID lessonId, String orderBy) {
        return Db.rows(jdbc.queryForList("SELECT * FROM " + table + " WHERE lesson_id = ? AND is_active = true ORDER BY " + orderBy, lessonId));
    }

    public List<Map<String, Object>> progress(UUID userId, UUID childId) {
        return Db.rows(jdbc.queryForList("SELECT * FROM progress WHERE user_id = ? AND child_id = ? ORDER BY completed_at DESC NULLS LAST", userId, childId));
    }

    public List<Map<String, Object>> attempts(UUID userId, UUID childId) {
        return Db.rows(jdbc.queryForList("SELECT * FROM activity_attempts WHERE user_id = ? AND child_id = ? ORDER BY created_at DESC", userId, childId));
    }

    public void upsertProgress(UUID userId, UUID childId, String lessonId, String activityType, int score, int totalQuestions, int correctAnswers) {
        jdbc.update("""
            INSERT INTO progress(user_id, child_id, lesson_id, activity_type, status, score, total_questions, correct_answers, completed_at)
            VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?, now())
            ON CONFLICT (user_id, child_id, lesson_id)
            DO UPDATE SET status = 'COMPLETED', score = EXCLUDED.score, total_questions = EXCLUDED.total_questions,
              correct_answers = EXCLUDED.correct_answers, completed_at = now()
            """, userId, childId, lessonId, activityType, score, totalQuestions, correctAnswers);
    }

    public boolean wasCompleted(UUID userId, UUID childId, String lessonId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM progress WHERE user_id = ? AND child_id = ? AND lesson_id = ? AND status = 'COMPLETED'",
            Integer.class,
            userId,
            childId,
            lessonId
        );
        return count != null && count > 0;
    }

    public void saveActivityAttempt(UUID userId, UUID childId, UUID lessonId, UUID activityId, String activityType, String result, double score, Map<String, Object> answerPayload, Object skillTags, int durationSec) {
        jdbc.update("""
            INSERT INTO activity_attempts(user_id, child_id, lesson_id, activity_id, activity_type, answer_payload, result, score, skill_tags, duration_sec)
            VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), ?, ?, CAST(? AS jsonb), ?)
            """, userId, childId, lessonId, activityId, activityType, Db.json(answerPayload), result, score, Db.json(skillTags), durationSec);
    }

    public Map<String, Object> activity(UUID activityId) {
        return jdbc.queryForList("SELECT * FROM activities WHERE id = ?", activityId)
            .stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("Hoạt động không tồn tại."));
    }
}
