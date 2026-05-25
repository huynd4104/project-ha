package com.projectha.media;

import com.projectha.common.AuthPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media")
public class MediaController {
    private final MediaService service;

    public MediaController(MediaService service) {
        this.service = service;
    }

    @PostMapping("/presign-upload")
    public Map<String, Object> presign(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return service.presign(principal.id(), payload);
    }

    @PostMapping("/complete-upload")
    public Map<String, Object> complete(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return service.complete(principal.id(), payload);
    }

    @GetMapping("/{id}")
    public Map<String, Object> byId(@PathVariable UUID id) {
        return service.byId(id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID id) {
        service.delete(id, principal.id());
        return Map.of("ok", true);
    }
}
