package com.projectha.admin;

import com.projectha.audit.AuditService;
import com.projectha.common.AuthPrincipal;
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

    public AdminController(AdminService admin, AuditService audit) {
        this.admin = admin;
        this.audit = audit;
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
