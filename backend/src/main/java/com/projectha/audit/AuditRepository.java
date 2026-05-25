package com.projectha.audit;

import com.projectha.common.Db;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuditRepository {
    private final JdbcTemplate jdbc;

    public AuditRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void log(UUID actorUserId, String action, String resourceType, String resourceId, Map<String, Object> metadata) {
        jdbc.update("""
            INSERT INTO audit_logs(actor_user_id, action, resource_type, resource_id, metadata)
            VALUES (?, ?, ?, ?, CAST(? AS jsonb))
            """, actorUserId, action, resourceType, resourceId, Db.json(metadata));
    }

    public List<Map<String, Object>> list(int limit) {
        return Db.rows(jdbc.queryForList("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?", limit));
    }
}
