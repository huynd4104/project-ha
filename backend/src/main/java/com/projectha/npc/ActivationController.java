package com.projectha.npc;

import com.projectha.common.AuthPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activation")
public class ActivationController {
    private final ActivationService service;

    public ActivationController(ActivationService service) {
        this.service = service;
    }

    @PostMapping("/redeem")
    public Map<String, Object> redeem(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return service.redeem(
            principal.id(),
            String.valueOf(payload.get("code")),
            UUID.fromString(String.valueOf(payload.get("childId"))),
            String.valueOf(payload.getOrDefault("source", "MANUAL"))
        );
    }
}
