package com.projectha.admin;

import com.projectha.audit.AuditService;
import com.projectha.common.AuthPrincipal;
import com.projectha.subscription.SubscriptionService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AdminController {
    private final AdminService admin;
    private final AuditService audit;
    private final SubscriptionService subscriptionService;

    public AdminController(AdminService admin, AuditService audit, SubscriptionService subscriptionService) {
        this.admin = admin;
        this.audit = audit;
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return admin.dashboard();
    }

    @PostMapping("/{resource}/batch")
    public List<Map<String, Object>> createBatch(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable String resource, @RequestBody List<Map<String, Object>> payloads) {
        return admin.createBatch(principal.id(), resource, payloads);
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/subscription/grant")
    public Map<String, Object> grantPremium(@RequestBody Map<String, Object> payload) {
        UUID userId = UUID.fromString(String.valueOf(payload.get("userId")));
        String plan = String.valueOf(payload.get("plan"));
        Object expiresAtObj = payload.get("expiresAt");
        Instant expiresAt = null;
        if (expiresAtObj != null) {
            expiresAt = Instant.ofEpochMilli(Long.parseLong(String.valueOf(expiresAtObj)));
        }
        Map<String, Object> entitlements = (Map<String, Object>) payload.get("entitlements");
        return subscriptionService.grant(userId, plan, expiresAt, entitlements);
    }

    @PostMapping("/subscription/revoke")
    public Map<String, Object> revokePremium(@RequestBody Map<String, Object> payload) {
        UUID userId = UUID.fromString(String.valueOf(payload.get("userId")));
        subscriptionService.revoke(userId);
        return Map.of("ok", true);
    }

    @GetMapping("/{resource}")
    public List<Map<String, Object>> list(@PathVariable String resource) {
        if ("audit-logs".equals(resource)) return audit.list(200);
        return admin.list(resource);
    }

    @GetMapping("/{resource}/{id}")
    public Map<String, Object> byId(@PathVariable String resource, @PathVariable UUID id) {
        return admin.byId(resource, id);
    }

    @PostMapping("/{resource}")
    public Map<String, Object> create(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable String resource, @RequestBody Map<String, Object> payload) {
        return admin.create(principal.id(), resource, payload);
    }

    @PutMapping("/{resource}/{id}")
    public Map<String, Object> update(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable String resource, @PathVariable UUID id, @RequestBody Map<String, Object> payload) {
        return admin.update(principal.id(), resource, id, payload);
    }

    @DeleteMapping("/{resource}/{id}")
    public Map<String, Object> delete(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable String resource, @PathVariable UUID id) {
        admin.delete(principal.id(), resource, id);
        return Map.of("ok", true);
    }
}
