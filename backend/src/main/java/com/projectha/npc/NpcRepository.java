package com.projectha.npc;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NpcRepository {
    private final JdbcTemplate jdbc;

    public NpcRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> active() {
        return Db.rows(jdbc.queryForList("SELECT * FROM npcs WHERE is_active = true ORDER BY name"));
    }

    public Map<String, Object> byId(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM npcs WHERE id = ?", id);
        return rows.stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("NPC không tồn tại."));
    }

    public List<Map<String, Object>> unlocked(UUID userId, UUID childId) {
        return Db.rows(jdbc.queryForList("""
            SELECT uun.*, to_jsonb(n) AS npc
            FROM user_unlocked_npcs uun
            JOIN npcs n ON n.id = uun.npc_id
            WHERE uun.user_id = ? AND uun.child_id = ?
            ORDER BY uun.unlocked_at DESC
            """, userId, childId));
    }
}
