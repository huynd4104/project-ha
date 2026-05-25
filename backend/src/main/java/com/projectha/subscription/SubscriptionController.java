package com.projectha.subscription;

import com.projectha.common.AuthPrincipal;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/subscription")
public class SubscriptionController {
    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> current(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.current(principal.id());
    }

    @PostMapping("/demo-upgrade")
    public Map<String, Object> demo(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.demoUpgrade(principal.id());
    }
}
