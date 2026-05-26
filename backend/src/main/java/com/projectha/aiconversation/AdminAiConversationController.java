package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.ActiveFlagRequest;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationQuestionRequest;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationTopicRequest;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationTopicResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai-conversations")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AdminAiConversationController {
    private final AiConversationAdminService service;

    public AdminAiConversationController(AiConversationAdminService service) {
        this.service = service;
    }

    @GetMapping("/topics")
    public List<AdminAiConversationTopicResponse> topics() {
        return service.topics();
    }

    @PostMapping("/topics")
    public AdminAiConversationTopicResponse createTopic(@RequestBody AdminAiConversationTopicRequest request) {
        return service.createTopic(request);
    }

    @PutMapping("/topics/{id}")
    public AdminAiConversationTopicResponse updateTopic(@PathVariable UUID id, @RequestBody AdminAiConversationTopicRequest request) {
        return service.updateTopic(id, request);
    }

    @PatchMapping("/topics/{id}/active")
    public AdminAiConversationTopicResponse setTopicActive(@PathVariable UUID id, @RequestBody ActiveFlagRequest request) {
        return service.setTopicActive(id, request.value());
    }

    @DeleteMapping("/topics/{id}")
    public Map<String, Object> deleteTopic(@PathVariable UUID id) {
        service.deleteTopic(id);
        return Map.of("ok", true);
    }

    @GetMapping("/topics/{topicId}/questions")
    public List<AdminAiConversationQuestionResponse> questions(@PathVariable UUID topicId) {
        return service.questions(topicId);
    }

    @PostMapping("/topics/{topicId}/questions")
    public AdminAiConversationQuestionResponse createQuestion(@PathVariable UUID topicId, @RequestBody AdminAiConversationQuestionRequest request) {
        return service.createQuestion(topicId, request);
    }

    @PutMapping("/questions/{id}")
    public AdminAiConversationQuestionResponse updateQuestion(@PathVariable UUID id, @RequestBody AdminAiConversationQuestionRequest request) {
        return service.updateQuestion(id, request);
    }

    @PatchMapping("/questions/{id}/active")
    public AdminAiConversationQuestionResponse setQuestionActive(@PathVariable UUID id, @RequestBody ActiveFlagRequest request) {
        return service.setQuestionActive(id, request.value());
    }

    @DeleteMapping("/questions/{id}")
    public Map<String, Object> deleteQuestion(@PathVariable UUID id) {
        service.deleteQuestion(id);
        return Map.of("ok", true);
    }
}
