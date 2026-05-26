package com.projectha.learning;

import com.projectha.common.AuthPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LearningController {
    private final LearningService service;

    public LearningController(LearningService service) {
        this.service = service;
    }

    @GetMapping("/programs")
    public List<Map<String, Object>> programs() {
        return service.programs();
    }

    @GetMapping("/learning-paths")
    public List<Map<String, Object>> paths() {
        return service.paths();
    }

    @GetMapping("/learning-goals/skill-tags")
    public Map<String, Object> goalSkillTags() {
        return service.goalSkillTags();
    }

    @GetMapping("/children/{childId}/learning-plan")
    public Map<String, Object> plan(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.learningPlan(principal.id(), childId);
    }

    @GetMapping("/children/{childId}/progress")
    public List<Map<String, Object>> progress(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.progress(principal.id(), childId);
    }

    @GetMapping("/children/{childId}/summary")
    public Map<String, Object> summary(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId) {
        return service.dashboardSummary(principal.id(), childId);
    }

    @GetMapping("/lessons/{lessonId}")
    public Map<String, Object> lesson(@PathVariable UUID lessonId) {
        return service.lesson(lessonId);
    }

    @GetMapping("/lessons/{lessonId}/activities")
    public List<Map<String, Object>> activities(@PathVariable UUID lessonId) {
        return service.activities(lessonId);
    }

    @GetMapping("/lessons/{lessonId}/math-questions")
    public List<Map<String, Object>> math(@PathVariable UUID lessonId) {
        return service.mathQuestions(lessonId);
    }

    @GetMapping("/lessons/{lessonId}/flashcards")
    public List<Map<String, Object>> flashcards(@PathVariable UUID lessonId) {
        return service.flashcards(lessonId);
    }

    @PostMapping("/children/{childId}/lessons/{lessonId}/attempts")
    public Map<String, Object> attempt(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId, @PathVariable UUID lessonId, @RequestBody Map<String, Object> payload) {
        return service.submitAttempt(principal.id(), childId, lessonId, payload);
    }

    @PostMapping("/children/{childId}/lessons/{lessonId}/complete")
    public Map<String, Object> complete(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId, @PathVariable UUID lessonId, @RequestBody Map<String, Object> payload) {
        return service.completeLesson(principal.id(), childId, lessonId, payload);
    }

    @PostMapping("/voice/answer")
    public Map<String, Object> voice(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return service.submitVoiceAnswer(principal.id(), payload);
    }
}
