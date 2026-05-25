package com.projectha.audit;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditRepository repo;

    public AuditService(AuditRepository repo) {
        this.repo = repo;
    }

    public void log(UUID actorUserId, String action, String resourceType, String resourceId, Map<String, Object> metadata) {
        repo.log(actorUserId, action, resourceType, resourceId, metadata == null ? Map.of() : metadata);
    }

    public List<Map<String, Object>> list(int limit) {
        return repo.list(limit);
    }
}
