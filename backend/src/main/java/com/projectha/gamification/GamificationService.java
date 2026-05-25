package com.projectha.gamification;

import com.projectha.child.ChildRepository;
import com.projectha.common.BadRequestException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GamificationService {
    private final GamificationRepository repo;
    private final ChildRepository children;

    public GamificationService(GamificationRepository repo, ChildRepository children) {
        this.repo = repo;
        this.children = children;
    }

    public Map<String, Object> levelStats(int totalXp) {
        return Map.of(
            "totalXp", totalXp,
            "level", (totalXp / 100) + 1,
            "xpInLevel", totalXp % 100,
            "xpToNextLevel", 100
        );
    }

    public Map<String, Object> xp(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        int total = repo.totalXp(userId, childId);
        return levelStats(total);
    }

    public Map<String, Object> streak(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        return repo.streak(userId, childId).orElse(null);
    }

    public List<Map<String, Object>> dailyMissions(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        List<Map<String, Object>> progress = repo.missionProgress(userId, childId, LocalDate.now());
        Map<String, Map<String, Object>> byMission = new LinkedHashMap<>();
        for (Map<String, Object> row : progress) byMission.put(String.valueOf(row.get("missionId")), row);
        return repo.activeMissions().stream().map(mission -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("mission", mission);
            item.put("progress", byMission.getOrDefault(String.valueOf(mission.get("id")), Map.of(
                "id", "",
                "userId", userId.toString(),
                "childId", childId.toString(),
                "missionId", mission.get("id"),
                "date", LocalDate.now().toString(),
                "currentValue", 0,
                "targetValue", mission.get("targetValue"),
                "isCompleted", false,
                "rewardClaimed", false
            )));
            return item;
        }).toList();
    }

    @Transactional
    public Map<String, Object> rewardSummary(UUID userId, UUID childId, int xpGained) {
        Map<String, Object> streak = repo.upsertStreak(userId, childId);
        List<Map<String, Object>> badges = repo.awardEligibleBadges(userId, childId);
        return Map.of(
            "xpGained", xpGained,
            "streak", streak,
            "newBadges", badges,
            "levelStats", levelStats(repo.totalXp(userId, childId))
        );
    }

    @Transactional
    public Map<String, Object> claim(UUID userId, UUID childId, UUID missionId) {
        children.requireOwned(userId, childId);
        try {
            repo.claimMission(userId, childId, missionId);
        } catch (Exception e) {
            throw new BadRequestException("Nhiệm vụ chưa hoàn thành hoặc phần thưởng đã được nhận.");
        }
        Map<String, Object> mission = repo.mission(missionId);
        int reward = ((Number) mission.getOrDefault("rewardXp", 0)).intValue();
        int xp = repo.awardXp(userId, childId, reward, "Nhận thưởng nhiệm vụ hàng ngày: " + mission.getOrDefault("title", ""));
        return Map.of("xpGained", xp, "levelStats", levelStats(repo.totalXp(userId, childId)));
    }

    public List<Map<String, Object>> badges(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        return repo.badges(userId, childId);
    }

    public int awardXp(UUID userId, UUID childId, int amount, String reason) {
        return repo.awardXp(userId, childId, amount, reason);
    }

    public void updateMissionProgress(UUID userId, UUID childId, String type, int increment) {
        repo.updateMissionProgress(userId, childId, type, increment);
    }
}
