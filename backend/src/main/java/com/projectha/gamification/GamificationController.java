package com.projectha.gamification;

import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/children/{childId}")
public class GamificationController {
    private final GamificationService service;

    public GamificationController(GamificationService service) {
        this.service = service;
    }

    @GetMapping("/xp")
    public Map<String, Object> xp(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.xp(principal.id(), childId);
    }

    @GetMapping("/streak")
    public Map<String, Object> streak(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.streak(principal.id(), childId);
    }

    @GetMapping("/daily-missions")
    public List<Map<String, Object>> missions(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.dailyMissions(principal.id(), childId);
    }

    @PostMapping("/daily-missions/{missionId}/claim")
    public Map<String, Object> claim(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId, @PathVariable UUID missionId) {
        return service.claim(principal.id(), childId, missionId);
    }

    @GetMapping("/badges")
    public List<Map<String, Object>> badges(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.badges(principal.id(), childId);
    }
}
