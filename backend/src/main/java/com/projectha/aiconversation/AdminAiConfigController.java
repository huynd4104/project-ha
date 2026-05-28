package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ai-config")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiConfigController {
    private final AiProviderConfigService service;

    public AdminAiConfigController(AiProviderConfigService service) {
        this.service = service;
    }

    @GetMapping("/gemini")
    public AdminGeminiConfigResponse getGeminiConfig() {
        return service.getGeminiConfig();
    }

    @PutMapping("/gemini")
    public AdminGeminiConfigResponse updateGeminiConfig(@RequestBody AdminGeminiConfigRequest request) {
        return service.updateGeminiConfig(request);
    }

    @PostMapping("/gemini/test")
    public AdminAiConfigTestResponse testGeminiConfig(@RequestBody(required = false) AdminAiConfigTestRequest request) {
        return service.testGeminiConfig(request);
    }
}
