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
        Map.entry("dialogues", "dialogues"),
        Map.entry("flashcards", "flashcards"),
        Map.entry("media-files", "media_files"),
        Map.entry("npcs", "npcs"),
        Map.entry("daily-missions", "daily_missions"),
        Map.entry("badges", "badges"),
        Map.entry("audit-logs", "audit_logs")
    );

    private static final Set<String> READ_ONLY = Set.of("audit_logs");
    private final JdbcTemplate jdbc;

    public AdminRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
                values.put(column, new Param(value, false));
            }
        });
        return values;
    }

    private record Param(Object value, boolean json) {}
}
