package com.projectha.npc;

import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class NpcController {
    private final NpcService service;

    public NpcController(NpcService service) {
        this.service = service;
    }

    @GetMapping("/npcs")
    public List<Map<String, Object>> active() {
        return service.active();
    }

    @GetMapping("/npcs/{id}")
    public Map<String, Object> byId(@PathVariable UUID id) {
        return service.byId(id);
    }

    @GetMapping("/children/{childId}/npcs/unlocked")
    public List<Map<String, Object>> unlocked(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.unlocked(principal.id(), childId);
    }
}
