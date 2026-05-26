package com.projectha.learning;

import com.projectha.child.ChildRepository;
import com.projectha.common.BadRequestException;
import com.projectha.common.NotFoundException;
import com.projectha.gamification.GamificationService;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningService {
    private final LearningRepository repo;
    private final ChildRepository children;
    private final GamificationService gamification;
    private final boolean mockVoiceEnabled;
    private final String voiceProvider;

    public LearningService(
        LearningRepository repo,
        ChildRepository children,
        GamificationService gamification,
        @Value("${project-ha.features.mock-voice-provider}") boolean mockVoiceEnabled,
        @Value("${project-ha.features.voice-provider}") String voiceProvider
    ) {
        this.repo = repo;
        this.children = children;
        this.gamification = gamification;
        this.mockVoiceEnabled = mockVoiceEnabled;
        this.voiceProvider = voiceProvider;
    }

    public List<Map<String, Object>> programs() {
        return repo.publishedPrograms();
    }

    public List<Map<String, Object>> paths() {
        return repo.publishedPaths();
    }

    public Map<String, Object> goalSkillTags() {
        return repo.goalSkillTags();
    }

    public Map<String, Object> learningPlan(UUID userId, UUID childId) {
        Map<String, Object> child = repo.child(userId, childId).orElseThrow(() -> new NotFoundException("Hồ sơ trẻ không thuộc tài khoản này."));
        Object currentPathId = child.get("currentPathId");
        if (currentPathId != null) {
            UUID pathId = UUID.fromString(String.valueOf(currentPathId));
            List<Map<String, Object>> lessons = repo.lessonsForPath(pathId);
            if (!lessons.isEmpty()) {
                Map<String, Object> path = repo.path(pathId).orElse(null);
                Map<String, Object> program = path == null || path.get("programId") == null
                    ? null
                    : repo.program(UUID.fromString(String.valueOf(path.get("programId")))).orElse(null);
                return plan(lessons, path, program, false, repo.pathItems(pathId));
            }
        }
        List<Map<String, Object>> paths = repo.publishedPaths();
        for (Map<String, Object> path : paths) {
            List<Map<String, Object>> lessons = repo.lessonsForPath(UUID.fromString(String.valueOf(path.get("id"))));
            if (!lessons.isEmpty()) {
                Map<String, Object> program = path.get("programId") == null
                    ? null
                    : repo.program(UUID.fromString(String.valueOf(path.get("programId")))).orElse(null);
                return plan(lessons, path, program, false, repo.pathItems(UUID.fromString(String.valueOf(path.get("id")))));
            }
        }
        return plan(repo.legacyLessons(), null, null, true, List.of());
    }

    public Map<String, Object> lesson(UUID lessonId) {
        return repo.lesson(lessonId);
    }

    public List<Map<String, Object>> activities(UUID lessonId) {
        return repo.byLesson("activities", lessonId, "order_index");
    }

    public List<Map<String, Object>> mathQuestions(UUID lessonId) {
        return repo.byLesson("math_questions", lessonId, "question_text");
    }

    public List<Map<String, Object>> flashcards(UUID lessonId) {
        return repo.byLesson("flashcards", lessonId, "front_text");
    }

    public List<Map<String, Object>> progress(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        return repo.progress(userId, childId);
    }

    public Map<String, Object> dashboardSummary(UUID userId, UUID childId) {
        children.requireOwned(userId, childId);
        return Map.of(
            "history", repo.progress(userId, childId),
            "lessons", repo.legacyLessons(),
            "attempts", repo.attempts(userId, childId)
        );
    }

    @Transactional
    public Map<String, Object> submitAttempt(UUID userId, UUID childId, UUID lessonId, Map<String, Object> payload) {
        children.requireOwned(userId, childId);
        UUID activityId = payload.get("activityId") == null || String.valueOf(payload.get("activityId")).isBlank()
            ? null
            : UUID.fromString(String.valueOf(payload.get("activityId")));
        repo.saveActivityAttempt(
            userId,
            childId,
            lessonId,
            activityId,
            str(payload, "activityType", "LEGACY"),
            str(payload, "result", "RECORDED"),
            number(payload.get("score"), 0),
            map(payload.get("answerPayload")),
            payload.getOrDefault("skillTags", List.of()),
            (int) number(payload.get("durationSec"), 0)
        );
        return Map.of("ok", true);
    }

    @Transactional
    public Map<String, Object> completeLesson(UUID userId, UUID childId, UUID lessonId, Map<String, Object> payload) {
        children.requireOwned(userId, childId);
        Map<String, Object> lesson = repo.lesson(lessonId);
        String lessonType = str(lesson, "type", str(payload, "completionType", "MATH")).toUpperCase(Locale.ROOT);
        boolean flashcard = "FLASHCARD".equals(lessonType) || "FLASHCARD".equals(str(payload, "completionType", ""));
        int totalQuestions = payload.get("totalQuestions") == null ? 0 : (int) number(payload.get("totalQuestions"), 0);
        int correctAnswers = payload.get("correctAnswers") == null ? 0 : (int) number(payload.get("correctAnswers"), 0);
        if (totalQuestions == 0) {
            List<Map<String, Object>> activities = activities(lessonId);
            if (!activities.isEmpty()) {
                totalQuestions = activities.size();
            } else if (flashcard) {
                totalQuestions = flashcards(lessonId).size();
                correctAnswers = totalQuestions;
            } else {
                List<Map<String, Object>> questions = mathQuestions(lessonId);
                totalQuestions = questions.size();
                Map<String, Object> answers = map(payload.get("answers"));
                correctAnswers = (int) questions.stream().filter(q -> String.valueOf(q.getOrDefault("correctOption", "A")).equals(String.valueOf(answers.get(String.valueOf(q.get("id")))))).count();
            }
        }
        int score = payload.get("score") == null ? (totalQuestions == 0 ? 0 : Math.round((correctAnswers * 100f) / totalQuestions)) : (int) number(payload.get("score"), 0);
        String legacyLessonId = flashcard ? lessonId + "_flashcard" : lessonId.toString();
        boolean alreadyCompleted = repo.wasCompleted(userId, childId, legacyLessonId);
        repo.upsertProgress(userId, childId, legacyLessonId, flashcard ? "FLASHCARD" : lessonType, score, totalQuestions, correctAnswers);
        int xp = 0;
        if (!alreadyCompleted) {
            xp = gamification.awardXp(userId, childId, flashcard ? 5 : 20, flashcard ? "Hoàn thành ôn tập thẻ học" : "Hoàn thành bài học: " + lesson.getOrDefault("title", ""));
        }
        gamification.updateMissionProgress(userId, childId, flashcard ? "REVIEW_FLASHCARD" : "COMPLETE_LESSON", 1);
        if ("MATH".equals(lessonType)) gamification.updateMissionProgress(userId, childId, "COMPLETE_MATH", 1);
        Map<String, Object> rewards = new LinkedHashMap<>(gamification.rewardSummary(userId, childId, xp));
        rewards.put("score", score);
        rewards.put("totalQuestions", totalQuestions);
        rewards.put("correctAnswers", correctAnswers);
        return rewards;
    }

    @Transactional
    public Map<String, Object> submitVoiceAnswer(UUID userId, Map<String, Object> payload) {
        UUID childId = UUID.fromString(String.valueOf(payload.get("childId")));
        UUID lessonId = UUID.fromString(String.valueOf(payload.get("lessonId")));
        UUID activityId = UUID.fromString(String.valueOf(payload.get("activityId")));
        children.requireOwned(userId, childId);
        Map<String, Object> activity = repo.activity(activityId);
        if (!"VOICE_ANSWER".equals(String.valueOf(activity.get("activityType")))) {
            throw new BadRequestException("Hoạt động này không phải trả lời bằng giọng nói.");
        }
        int durationSec = (int) number(payload.get("durationSec"), 3);
        if (durationSec > 6) throw new BadRequestException("Thời lượng ghi âm tối đa là 5 giây.");
        String transcript = "";
        String provider = "mock";
        if ("mock".equalsIgnoreCase(voiceProvider)) {
            transcript = str(payload, "mockTranscript", "");
            if (transcript.isBlank() && mockVoiceEnabled) {
                List<?> accepted = activity.get("acceptedAnswers") instanceof List<?> list ? list : List.of();
                transcript = accepted.isEmpty() ? "xin chào" : String.valueOf(accepted.get(0));
                provider = "mock_default";
            }
        } else {
            provider = voiceProvider;
            transcript = "STT provider placeholder";
        }
        String result = scoreTranscript(transcript, activity);
        String feedback = switch (result) {
            case "CORRECT" -> "Con nói rất tốt!";
            case "ALMOST" -> "Gần đúng rồi, con thử lại nhé!";
            case "NO_SPEECH_DETECTED" -> "Mimi chưa nghe rõ con nói gì, con hãy nói to hơn một chút nhé!";
            default -> "Chưa chính xác. Chúng mình thử lại nhé!";
        };
        repo.saveActivityAttempt(userId, childId, lessonId, activityId, "VOICE_ANSWER", result, "CORRECT".equals(result) ? 1 : 0, Map.of("transcript", transcript), activity.get("skillTags"), durationSec);
        return Map.of("transcript", transcript, "result", result, "feedbackText", feedback, "confidence", 1.0, "provider", provider);
    }

    private Map<String, Object> plan(List<Map<String, Object>> lessons, Map<String, Object> path, Map<String, Object> program, boolean legacy, List<Map<String, Object>> pathItems) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("lessons", lessons);
        out.put("path", path);
        out.put("program", program);
        out.put("recommendations", List.of());
        out.put("usesLegacyFallback", legacy);
        out.put("pathItems", pathItems);
        return out;
    }

    private String scoreTranscript(String transcript, Map<String, Object> activity) {
        String clean = normalize(transcript);
        if (clean.isBlank()) return "NO_SPEECH_DETECTED";
        List<?> accepted = activity.get("acceptedAnswers") instanceof List<?> list ? list : List.of();
        List<?> almost = activity.get("almostAnswers") instanceof List<?> list ? list : List.of();
        if (accepted.stream().map(item -> normalize(String.valueOf(item))).anyMatch(clean::equals)) return "CORRECT";
        if (almost.stream().map(item -> normalize(String.valueOf(item))).anyMatch(clean::equals)) return "ALMOST";
        return "WRONG";
    }

    private String normalize(String value) {
        String text = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .replace('đ', 'd')
            .replace('Đ', 'D')
            .toLowerCase(Locale.ROOT)
            .replaceAll("[.,/#!$%^&*;:{}=\\-_`~()?]", "")
            .trim();
        return text.replaceAll("\\s+", " ");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object value) {
        return value instanceof Map<?, ?> raw ? (Map<String, Object>) raw : Map.of();
    }

    private String str(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private double number(Object value, double fallback) {
        if (value instanceof Number n) return n.doubleValue();
        try {
            return value == null ? fallback : Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }
}
