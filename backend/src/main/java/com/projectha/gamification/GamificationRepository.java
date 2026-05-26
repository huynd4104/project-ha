package com.projectha.gamification;

import com.projectha.common.Db;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GamificationRepository {
    private final JdbcTemplate jdbc;

    public GamificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public int totalXp(UUID userId, UUID childId) {
        Integer total = jdbc.queryForObject(
            "SELECT COALESCE(SUM(amount), 0) FROM xp_logs WHERE user_id = ? AND child_id = ?",
            Integer.class,
            userId,
            childId
        );
        return total == null ? 0 : total;
    }

    public int awardXp(UUID userId, UUID childId, int amount, String reason) {
        if (amount <= 0) return 0;
        jdbc.update("INSERT INTO xp_logs(user_id, child_id, amount, reason) VALUES (?, ?, ?, ?)", userId, childId, amount, reason);
        return amount;
    }

    public Optional<Map<String, Object>> streak(UUID userId, UUID childId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM streaks WHERE user_id = ? AND child_id = ?", userId, childId);
        return rows.stream().findFirst().map(Db::row);
    }

    public Map<String, Object> upsertStreak(UUID userId, UUID childId) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        Optional<Map<String, Object>> existing = streak(userId, childId);
        if (existing.isEmpty()) {
            return Db.row(jdbc.queryForMap("""
                INSERT INTO streaks(user_id, child_id, current_streak, longest_streak, last_active_date)
                VALUES (?, ?, 1, 1, ?)
                RETURNING *
                """, userId, childId, today));
        }
        Map<String, Object> current = existing.get();
        LocalDate last = current.get("lastActiveDate") == null ? null : LocalDate.parse(String.valueOf(current.get("lastActiveDate")));
        if (today.equals(last)) return current;
        int currentStreak = yesterday.equals(last) ? ((Number) current.get("currentStreak")).intValue() + 1 : 1;
        int longest = Math.max(currentStreak, ((Number) current.get("longestStreak")).intValue());
        return Db.row(jdbc.queryForMap("""
            UPDATE streaks SET current_streak = ?, longest_streak = ?, last_active_date = ?
            WHERE id = CAST(? AS uuid)
            RETURNING *
            """, currentStreak, longest, today, current.get("id")));
    }

    public List<Map<String, Object>> activeMissions() {
        return Db.rows(jdbc.queryForList("SELECT * FROM daily_missions WHERE is_active = true ORDER BY created_at"));
    }

    public List<Map<String, Object>> missionProgress(UUID userId, UUID childId, LocalDate date) {
        return Db.rows(jdbc.queryForList(
            "SELECT * FROM user_mission_progress WHERE user_id = ? AND child_id = ? AND date = ?",
            userId, childId, date
        ));
    }

    public void updateMissionProgress(UUID userId, UUID childId, String type, int increment) {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> missions = jdbc.queryForList("SELECT * FROM daily_missions WHERE is_active = true AND type = ?", type);
        for (Map<String, Object> mission : missions) {
            UUID missionId = (UUID) mission.get("id");
            int target = ((Number) mission.get("target_value")).intValue();
            jdbc.update("""
                INSERT INTO user_mission_progress(user_id, child_id, mission_id, date, current_value, target_value, is_completed, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ? >= ?, CASE WHEN ? >= ? THEN now() ELSE NULL END)
                ON CONFLICT (user_id, child_id, mission_id, date)
                DO UPDATE SET
                  current_value = user_mission_progress.current_value + EXCLUDED.current_value,
                  is_completed = user_mission_progress.is_completed OR (user_mission_progress.current_value + EXCLUDED.current_value >= user_mission_progress.target_value),
                  completed_at = CASE
                    WHEN user_mission_progress.completed_at IS NULL AND user_mission_progress.current_value + EXCLUDED.current_value >= user_mission_progress.target_value THEN now()
                    ELSE user_mission_progress.completed_at
                  END
                """, userId, childId, missionId, today, increment, target, increment, target, increment, target);
        }
    }

    public Map<String, Object> claimMission(UUID userId, UUID childId, UUID missionId) {
        return Db.row(jdbc.queryForMap("""
            UPDATE user_mission_progress
            SET reward_claimed = true,
                reward_claimed_at = now(),
                is_completed = true,
                completed_at = COALESCE(completed_at, now())
            WHERE user_id = ? AND child_id = ? AND mission_id = ? AND date = ?
              AND (is_completed = true OR current_value >= target_value)
              AND reward_claimed = false
            RETURNING *
            """, userId, childId, missionId, LocalDate.now()));
    }

    public Map<String, Object> mission(UUID missionId) {
        return Db.row(jdbc.queryForMap("SELECT * FROM daily_missions WHERE id = ?", missionId));
    }

    public List<Map<String, Object>> badges(UUID userId, UUID childId) {
        return Db.rows(jdbc.queryForList("""
            SELECT b.*, (ub.id IS NOT NULL) AS is_earned
            FROM badges b
            LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ? AND ub.child_id = ?
            WHERE b.is_active = true
            ORDER BY b.created_at
            """, userId, childId));
    }

    public List<Map<String, Object>> awardEligibleBadges(UUID userId, UUID childId) {
        int totalXp = totalXp(userId, childId);
        int completed = jdbc.queryForObject("SELECT COUNT(*) FROM progress WHERE user_id = ? AND child_id = ? AND status = 'COMPLETED'", Integer.class, userId, childId);
        int streak = streak(userId, childId).map(s -> ((Number) s.get("currentStreak")).intValue()).orElse(0);
        int npcs = jdbc.queryForObject("SELECT COUNT(*) FROM user_unlocked_npcs WHERE user_id = ? AND child_id = ?", Integer.class, userId, childId);
        int missions = jdbc.queryForObject("SELECT COUNT(*) FROM user_mission_progress WHERE user_id = ? AND child_id = ? AND is_completed = true", Integer.class, userId, childId);
        List<Map<String, Object>> badges = Db.rows(jdbc.queryForList("""
            SELECT b.* FROM badges b
            LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ? AND ub.child_id = ?
            WHERE b.is_active = true AND ub.id IS NULL
            """, userId, childId));
        for (Map<String, Object> badge : badges) {
            String type = String.valueOf(badge.get("conditionType"));
            int value = ((Number) badge.get("conditionValue")).intValue();
            boolean ok = switch (type) {
                case "COMPLETE_LESSONS" -> completed >= value;
                case "STREAK_DAYS" -> streak >= value;
                case "TOTAL_XP" -> totalXp >= value;
                case "UNLOCK_NPCS" -> npcs >= value;
                case "COMPLETE_DAILY_MISSIONS" -> missions >= value;
                default -> false;
            };
            if (ok) {
                jdbc.update("INSERT INTO user_badges(user_id, child_id, badge_id) VALUES (?, ?, CAST(? AS uuid)) ON CONFLICT DO NOTHING", userId, childId, badge.get("id"));
                badge.put("isEarned", true);
            }
        }
        return badges.stream().filter(b -> Boolean.TRUE.equals(b.get("isEarned"))).toList();
    }
}
