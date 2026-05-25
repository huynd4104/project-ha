package com.projectha.child;

import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/children")
public class ChildController {
    private final ChildRepository children;

    public ChildController(ChildRepository children) {
        this.children = children;
    }

    @GetMapping
    public List<Map<String, Object>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return children.list(principal.id());
    }

    @PostMapping
    public Map<String, Object> create(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return children.create(principal.id(), payload);
    }

    @PutMapping("/{childId}")
    public Map<String, Object> update(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId, @RequestBody Map<String, Object> payload) {
        return children.update(principal.id(), childId, payload);
    }

    @PutMapping("/{childId}/current-path")
    public Map<String, Object> currentPath(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId,
        @RequestBody Map<String, Object> payload
    ) {
        return children.saveCurrentPath(
            principal.id(),
            childId,
            UUID.fromString(String.valueOf(payload.get("programId"))),
            UUID.fromString(String.valueOf(payload.get("pathId")))
        );
    }
}
