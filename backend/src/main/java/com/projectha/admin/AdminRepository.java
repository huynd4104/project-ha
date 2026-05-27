package com.projectha.admin;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminRepository {
    private static final Map<String, String> TABLES = Map.ofEntries(
        Map.entry("users", "users"),
        Map.entry("children", "children"),
        Map.entry("programs", "programs"),
        Map.entry("learning-paths", "learning_paths"),
        Map.entry("path-items", "path_items"),
        Map.entry("lessons", "lessons"),
        Map.entry("activities", "activities"),
        Map.entry("math-questions", "math_questions"),
        Map.entry("flashcards", "flashcards"),
        Map.entry("media-files", "media_files"),
        Map.entry("npcs", "npcs"),
        Map.entry("daily-missions", "daily_missions"),
        Map.entry("badges", "badges"),
        Map.entry("audit-logs", "audit_logs"),
        Map.entry("activation-codes", "activation_codes"),
        Map.entry("qr-codes", "qr_codes"),
        Map.entry("development-categories", "development_categories"),
        Map.entry("learning-goals", "learning_goals"),
        Map.entry("skills", "skills"),
        Map.entry("transactions", "transactions"),
        Map.entry("media-assets", "media_assets"),
        Map.entry("nfc-tags", "nfc_tags"),
        Map.entry("number-items", "number_items"),
        Map.entry("number-examples", "number_examples"),
        Map.entry("number-counting-questions", "number_counting_questions"),
        Map.entry("shape-items", "shape_items"),
        Map.entry("shape-examples", "shape_examples"),
        Map.entry("shape-recognition-questions", "shape_recognition_questions")
    );

    private static final Set<String> READ_ONLY = Set.of("audit_logs");
    private final JdbcTemplate jdbc;

    public AdminRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> dashboard() {
        int totalUsers = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        int totalChildren = jdbc.queryForObject("SELECT COUNT(*) FROM children", Integer.class);
        int totalNPCs = jdbc.queryForObject("SELECT COUNT(*) FROM npcs", Integer.class);
        int totalQRCodes = jdbc.queryForObject("SELECT COUNT(*) FROM qr_codes", Integer.class);
        int totalLessons = jdbc.queryForObject("SELECT COUNT(*) FROM lessons", Integer.class);
        int totalCompletedLessons = jdbc.queryForObject("SELECT COUNT(*) FROM progress WHERE status = 'COMPLETED'", Integer.class);
        int totalBadges = jdbc.queryForObject("SELECT COUNT(*) FROM badges", Integer.class);
        int totalActiveMissions = jdbc.queryForObject("SELECT COUNT(*) FROM daily_missions WHERE is_active = true", Integer.class);
        int badgesEarnedCount = jdbc.queryForObject("SELECT COUNT(*) FROM user_badges", Integer.class);
        int missionCompletionsToday = jdbc.queryForObject("SELECT COUNT(*) FROM user_mission_progress WHERE date = CURRENT_DATE AND is_completed = true", Integer.class);

        List<Map<String, Object>> recentUsers = Db.rows(jdbc.queryForList("SELECT * FROM users ORDER BY created_at DESC LIMIT 5"));
        recentUsers.forEach(u -> u.remove("passwordHash"));

        List<Map<String, Object>> popularLessonsRaw = jdbc.queryForList("""
            SELECT l.*, COUNT(p.id) as completed_count
            FROM lessons l
            LEFT JOIN progress p ON l.id::text = p.lesson_id AND p.status = 'COMPLETED'
            GROUP BY l.id
            ORDER BY completed_count DESC, l.title ASC
            LIMIT 5
            """);
        List<Map<String, Object>> popularLessons = new ArrayList<>();
        for (Map<String, Object> row : popularLessonsRaw) {
            Map<String, Object> camelRow = Db.row(row);
            camelRow.put("completedCount", ((Number) row.get("completed_count")).intValue());
            popularLessons.add(camelRow);
        }

        return Map.ofEntries(
            Map.entry("totalUsers", totalUsers),
            Map.entry("totalChildren", totalChildren),
            Map.entry("totalNPCs", totalNPCs),
            Map.entry("totalQRCodes", totalQRCodes),
            Map.entry("totalLessons", totalLessons),
            Map.entry("totalCompletedLessons", totalCompletedLessons),
            Map.entry("recentUsers", recentUsers),
            Map.entry("popularLessons", popularLessons),
            Map.entry("totalBadges", totalBadges),
            Map.entry("totalActiveMissions", totalActiveMissions),
            Map.entry("badgesEarnedCount", badgesEarnedCount),
            Map.entry("missionCompletionsToday", missionCompletionsToday)
        );
    }


    public String table(String resource) {
        String table = TABLES.get(resource);
        if (table == null) throw new NotFoundException("Resource admin không tồn tại: " + resource);
        return table;
    }

    public List<Map<String, Object>> list(String resource, int limit) {
        String table = table(resource);
        return Db.rows(jdbc.queryForList("SELECT * FROM " + table + " ORDER BY created_at DESC LIMIT ?", limit));
    }

    public Map<String, Object> byId(String resource, UUID id) {
        String table = table(resource);
        return jdbc.queryForList("SELECT * FROM " + table + " WHERE id = ?", id)
            .stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi."));
    }

    public Map<String, Object> create(String resource, Map<String, Object> payload) {
        String table = writable(resource);
        Map<String, Param> values = writablePayload(payload);
        if (values.isEmpty()) throw new IllegalArgumentException("Payload rỗng.");
        String columns = String.join(", ", values.keySet());
        String placeholders = String.join(", ", values.values().stream().map(param -> param.json ? "CAST(? AS jsonb)" : "?").toList());
        return Db.row(jdbc.queryForMap(
            "INSERT INTO " + table + "(" + columns + ") VALUES (" + placeholders + ") RETURNING *",
            values.values().stream().map(param -> param.value).toArray()
        ));
    }

    public Map<String, Object> update(String resource, UUID id, Map<String, Object> payload) {
        String table = writable(resource);
        Map<String, Param> values = writablePayload(payload);
        if (values.isEmpty()) return byId(resource, id);
        List<Object> args = new ArrayList<>(values.values().stream().map(param -> param.value).toList());
        args.add(id);
        String setters = String.join(", ", values.entrySet().stream().map(e -> e.getKey() + " = " + (e.getValue().json ? "CAST(? AS jsonb)" : "?")).toList());
        return Db.row(jdbc.queryForMap(
            "UPDATE " + table + " SET " + setters + " WHERE id = ? RETURNING *",
            args.toArray()
        ));
    }

    public void delete(String resource, UUID id) {
        String table = writable(resource);
        jdbc.update("DELETE FROM " + table + " WHERE id = ?", id);
    }

    public List<Map<String, Object>> listActivitiesByLesson(UUID lessonId) {
        return Db.rows(jdbc.queryForList("SELECT * FROM activities WHERE lesson_id = ? ORDER BY order_index ASC", lessonId));
    }


    private String writable(String resource) {
        String table = table(resource);
        if (READ_ONLY.contains(table)) throw new IllegalArgumentException("Resource chỉ đọc.");
        return table;
    }

    private Map<String, Param> writablePayload(Map<String, Object> payload) {
        Map<String, Param> values = new LinkedHashMap<>();
        payload.forEach((key, value) -> {
            if ("id".equals(key) || "createdAt".equals(key) || "updatedAt".equals(key)) return;
            String column = Db.snake(key);
            if (value instanceof Map<?, ?> || value instanceof List<?>) {
                values.put(column, new Param(Db.json(value), true));
            } else {
                Object finalValue = value;
                if (value instanceof String str && str.length() == 36) {
                    try {
                        finalValue = java.util.UUID.fromString(str);
                    } catch (IllegalArgumentException e) {
                        // Not a valid UUID
                    }
                }
                values.put(column, new Param(finalValue, false));
            }
        });
        return values;
    }

    private record Param(Object value, boolean json) {}
}
