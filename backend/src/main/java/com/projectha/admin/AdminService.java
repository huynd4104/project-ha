package com.projectha.admin;

import com.projectha.audit.AuditService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    private final AdminRepository repo;
    private final AuditService audit;

    public AdminService(AdminRepository repo, AuditService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    public List<Map<String, Object>> list(String resource) {
        return repo.list(resource, 200);
    }

    public Map<String, Object> byId(String resource, UUID id) {
        return repo.byId(resource, id);
    }

    public Map<String, Object> create(UUID actor, String resource, Map<String, Object> payload) {
        Map<String, Object> item = repo.create(resource, payload);
        audit.log(actor, "CREATE", resource, String.valueOf(item.get("id")), Map.of("payload", payload));
        return item;
    }

    public Map<String, Object> update(UUID actor, String resource, UUID id, Map<String, Object> payload) {
        Map<String, Object> item = repo.update(resource, id, payload);
        audit.log(actor, "UPDATE", resource, id.toString(), Map.of("payload", payload));
        return item;
    }

    public void delete(UUID actor, String resource, UUID id) {
        repo.delete(resource, id);
        audit.log(actor, "DELETE", resource, id.toString(), Map.of());
    }
}
