package com.projectha.npc;

import com.projectha.child.ChildRepository;
import com.projectha.common.BadRequestException;
import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import com.projectha.gamification.GamificationService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivationService {
    private final JdbcTemplate jdbc;
    private final ChildRepository children;
    private final NpcRepository npcs;
    private final GamificationService gamification;

    public ActivationService(JdbcTemplate jdbc, ChildRepository children, NpcRepository npcs, GamificationService gamification) {
        this.jdbc = jdbc;
        this.children = children;
        this.npcs = npcs;
        this.gamification = gamification;
    }

    @Transactional
    public Map<String, Object> redeem(UUID userId, String code, UUID childId, String source) {
        children.requireOwned(userId, childId);
        Map<String, Object> match = findCode(code);
        if (match == null) throw new NotFoundException("Mã kích hoạt không tồn tại. Vui lòng kiểm tra lại mã.");
        if (Boolean.FALSE.equals(match.get("active")) || Boolean.FALSE.equals(match.get("isActive"))) {
            throw new BadRequestException("Mã kích hoạt này hiện đang tạm dừng hoạt động.");
        }
        Object maxUses = match.get("maxUses");
        Object usedCount = match.get("usedCount");
        if (maxUses instanceof Number max && usedCount instanceof Number used && used.intValue() >= max.intValue()) {
            throw new BadRequestException("Mã kích hoạt này đã đạt giới hạn lượt sử dụng tối đa.");
        }
        String targetType = String.valueOf(match.getOrDefault("activationType", "NPC")).toUpperCase();
        if (!"NPC".equals(targetType)) throw new BadRequestException("Giai đoạn này chỉ hỗ trợ kích hoạt Mascot/NPC.");
        UUID npcId = UUID.fromString(String.valueOf(match.get("targetId")));
        Map<String, Object> npc = npcs.byId(npcId);
        List<Map<String, Object>> existing = jdbc.queryForList("""
            SELECT id FROM user_unlocked_npcs WHERE user_id = ? AND child_id = ? AND npc_id = ?
            """, userId, childId, npcId);
        if (!existing.isEmpty()) {
            var out = new java.util.LinkedHashMap<String, Object>();
            out.put("npc", npc);
            out.put("message", "Mascot này đã có sẵn trong bộ sưu tập của bé!");
            out.put("xpGained", 0);
            out.put("levelStats", gamification.xp(userId, childId));
            out.put("newBadges", List.of());
            out.put("streak", gamification.streak(userId, childId));
            return out;
        }
        String table = String.valueOf(match.get("_table"));
        UUID codeId = UUID.fromString(String.valueOf(match.get("id")));
        jdbc.update("""
            INSERT INTO activation_redemptions(code_id, code_collection, user_id, child_id, target_type, target_id, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
            """, codeId, table, userId, childId, targetType, npcId, source);
        jdbc.update("""
            INSERT INTO user_unlocked_npcs(user_id, child_id, npc_id, qr_code_id, activation_code_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
            """, userId, childId, npcId, "qr_codes".equals(table) ? codeId : null, "activation_codes".equals(table) ? codeId : null);
        jdbc.update("UPDATE " + table + " SET used_count = used_count + 1 WHERE id = ?", codeId);
        int xp = gamification.awardXp(userId, childId, 10, "Mở khóa Mascot: " + npc.getOrDefault("name", ""));
        gamification.updateMissionProgress(userId, childId, "SCAN_QR", 1);
        Map<String, Object> rewards = gamification.rewardSummary(userId, childId, xp);
        var out = new java.util.LinkedHashMap<String, Object>();
        out.put("npc", npc);
        out.put("message", "Mở khóa Mascot thành công!");
        out.put("xpGained", rewards.get("xpGained"));
        out.put("levelStats", rewards.get("levelStats"));
        out.put("newBadges", rewards.get("newBadges"));
        out.put("streak", rewards.get("streak"));
        return out;
    }

    private Map<String, Object> findCode(String code) {
        for (String table : List.of("activation_codes", "qr_codes")) {
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM " + table + " WHERE lower(code) = lower(?) LIMIT 1", code.trim());
            if (!rows.isEmpty()) {
                Map<String, Object> row = Db.row(rows.get(0));
                row.put("_table", table);
                return row;
            }
        }
        return null;
    }
}
