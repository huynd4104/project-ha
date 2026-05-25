package com.projectha.npc;

import com.projectha.child.ChildRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class NpcService {
    private final NpcRepository repo;
    private final ChildRepository children;

    public NpcService(NpcRepository repo, ChildRepository children) {
        this.repo = repo;
        this.children = children;
    }

    public List<Map<String, Object>> active() {
        return repo.active();
    }

    public Map<String, Object> byId(UUID id) {
        return repo.byId(id);
    }

    public List<Map<String, Object>> unlocked(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        return repo.unlocked(userId, childId);
    }
}
